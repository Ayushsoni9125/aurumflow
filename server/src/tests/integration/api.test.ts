import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRouter from '../../routes/api';
import { errorMiddleware } from '../../middleware/errorMiddleware';
import prisma from '../../repositories/prismaClient';

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);
app.use(errorMiddleware);

describe('API Integration Tests', () => {
  let schemeId = '';

  beforeAll(async () => {
    // Ensure we have seeded plans
    const scheme = await prisma.loanScheme.findFirst({ where: { isActive: true } });
    if (scheme) schemeId = scheme.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/loan-schemes', () => {
    it('returns active schemes', async () => {
      const res = await request(app).get('/api/v1/loan-schemes');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
    });
  });

  describe('POST /api/v1/quotes', () => {
    it('calculates a valid quote without creating a lead', async () => {
      const payload = {
        grossWeightGrams: 50,
        netWeightGrams: 45,
        karat: 22,
      };

      const res = await request(app).post('/api/v1/quotes').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const { data } = res.body;
      expect(data.pureGoldGrams).toBeCloseTo(41.25, 4);
      expect(data.goldValueRupees).toBe(288750);
      expect(data.schemes.length).toBeGreaterThan(0);
    });

    it('rejects net weight > gross weight (Test 4)', async () => {
      const payload = {
        grossWeightGrams: 50,
        netWeightGrams: 52,
        karat: 22,
      };

      const res = await request(app).post('/api/v1/quotes').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      
      const fieldError = res.body.error.fields.find((f: any) => f.field === 'netWeightGrams');
      expect(fieldError).toBeDefined();
    });

    it('rejects invalid karat', async () => {
      const payload = {
        grossWeightGrams: 50,
        netWeightGrams: 45,
        karat: 20, // invalid
      };

      const res = await request(app).post('/api/v1/quotes').send(payload);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/leads', () => {
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    it('creates a valid lead', async () => {
      if (!schemeId) throw new Error('No scheme found');

      const payload = {
        customerName: 'Test User',
        mobileNumber: mobile,
        grossWeightGrams: 50,
        netWeightGrams: 45,
        karat: 22,
        selectedPlanId: schemeId,
      };

      const res = await request(app).post('/api/v1/leads').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.applicationId).toBeDefined();
      expect(res.body.data.status).toBe('SUBMITTED');
    });

    it('rejects duplicate mobile within 7 days (Test 6)', async () => {
      if (!schemeId) throw new Error('No scheme found');

      const payload = {
        customerName: 'Test User Two',
        mobileNumber: mobile,
        grossWeightGrams: 40,
        netWeightGrams: 35,
        karat: 18,
        selectedPlanId: schemeId,
      };

      const res = await request(app).post('/api/v1/leads').send(payload);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.fields[0].message).toContain('already exists');
    });

    it('rejects invalid mobile (Test 5)', async () => {
      if (!schemeId) throw new Error('No scheme found');

      const invalidMobiles = ['5876543210', '98765'];

      for (const invalid of invalidMobiles) {
        const payload = {
          customerName: 'Test User',
          mobileNumber: invalid,
          grossWeightGrams: 50,
          netWeightGrams: 45,
          karat: 22,
          selectedPlanId: schemeId,
        };

        const res = await request(app).post('/api/v1/leads').send(payload);
        expect(res.status).toBe(400);
        expect(res.body.error.fields.some((f: any) => f.field === 'mobileNumber')).toBe(true);
      }
    });

    it('BONUS 7: Same request, same Idempotency-Key returns original 201 replayed', async () => {
      if (!schemeId) throw new Error('No scheme found');

      const uniqueMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
      const idempotencyKey = `idem-${Date.now()}-${Math.random()}`;

      const payload = {
        customerName: 'Idempotency User',
        mobileNumber: uniqueMobile,
        grossWeightGrams: 50,
        netWeightGrams: 45,
        karat: 22,
        selectedPlanId: schemeId,
      };

      // First call
      const res1 = await request(app)
        .post('/api/v1/leads')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res1.status).toBe(201);
      const originalAppId = res1.body.data.applicationId;

      // Second identical call with same Idempotency-Key
      const res2 = await request(app)
        .post('/api/v1/leads')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res2.status).toBe(201);
      expect(res2.body.data.applicationId).toBe(originalAppId);
    });

    it('BONUS 8: 2 parallel requests with same new mobile result in exactly one 201 and one 409', async () => {
      if (!schemeId) throw new Error('No scheme found');

      const parallelMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

      const payload = {
        customerName: 'Parallel User',
        mobileNumber: parallelMobile,
        grossWeightGrams: 50,
        netWeightGrams: 45,
        karat: 22,
        selectedPlanId: schemeId,
      };

      const [res1, res2] = await Promise.all([
        request(app).post('/api/v1/leads').send(payload),
        request(app).post('/api/v1/leads').send(payload),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });

    it('returns 404 for nonexistent plan', async () => {
      const payload = {
        customerName: 'Test User',
        mobileNumber: '9999999999',
        grossWeightGrams: 50,
        netWeightGrams: 45,
        karat: 22,
        selectedPlanId: 'FAKE_PLAN',
      };

      const res = await request(app).post('/api/v1/leads').send(payload);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/leads', () => {
    it('returns paginated leads with masked mobile', async () => {
      const res = await request(app).get('/api/v1/leads');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      if (res.body.data.length > 0) {
        const firstLead = res.body.data[0];
        expect(firstLead).toHaveProperty('applicationId');
        expect(firstLead.maskedMobile).toMatch(/^\d{4}XXXX\d{2}$/);
      }
    });
  });
});
