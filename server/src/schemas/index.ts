/**
 * Shared Zod validation schemas for AurumFlow.
 * These schemas are used by both the API routes AND the AI agent tools.
 * Never duplicate validation logic — import from here.
 */

import { z } from 'zod';

// ─── Gold weights ────────────────────────────────────────────────────────────

export const grossWeightSchema = z
  .number({
    required_error: 'Gross weight is required.',
    invalid_type_error: 'Gross weight must be a number.',
  })
  .positive('Gross weight must be greater than zero.')
  .max(1000, 'Gross weight cannot exceed 1000 grams.')
  .finite('Gross weight must be a finite number.')
  .refine((v) => !Number.isNaN(v), 'Gross weight must be a valid number.');

export const netWeightSchema = z
  .number({
    required_error: 'Net weight is required.',
    invalid_type_error: 'Net weight must be a number.',
  })
  .positive('Net weight must be greater than zero.')
  .max(1000, 'Net weight cannot exceed 1000 grams.')
  .finite('Net weight must be a finite number.')
  .refine((v) => !Number.isNaN(v), 'Net weight must be a valid number.');

// ─── Karat ───────────────────────────────────────────────────────────────────

export const VALID_KARATS = [18, 22, 24] as const;
export type ValidKarat = (typeof VALID_KARATS)[number];

export const karatSchema = z.union(
  [z.literal(18), z.literal(22), z.literal(24)],
  {
    required_error: 'Karat/purity is required.',
    invalid_type_error: 'Karat must be 18, 22, or 24.',
  }
);

// ─── Quote request ────────────────────────────────────────────────────────────

export const quoteRequestSchema = z
  .object({
    grossWeightGrams: grossWeightSchema,
    netWeightGrams: netWeightSchema,
    karat: karatSchema,
  })
  .refine((data) => data.netWeightGrams <= data.grossWeightGrams, {
    message: 'Net weight cannot exceed gross weight.',
    path: ['netWeightGrams'],
  });

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

// ─── Customer name ────────────────────────────────────────────────────────────

// Letters (including Unicode letters) and spaces only, 2–60 chars
export const customerNameSchema = z
  .string({
    required_error: 'Customer name is required.',
    invalid_type_error: 'Customer name must be a string.',
  })
  .trim()
  .min(2, 'Name must be at least 2 characters.')
  .max(60, 'Name must not exceed 60 characters.')
  .regex(
    /^[\p{L}\p{M} ]+$/u,
    'Name may only contain letters and spaces.'
  );

// ─── Mobile number ────────────────────────────────────────────────────────────

export const mobileNumberSchema = z
  .string({
    required_error: 'Mobile number is required.',
    invalid_type_error: 'Mobile number must be a string.',
  })
  .regex(
    /^[6-9]\d{9}$/,
    'Mobile number must be a valid 10-digit Indian mobile number starting with 6–9.'
  );

// ─── Plan ID ─────────────────────────────────────────────────────────────────

export const planIdSchema = z
  .string({
    required_error: 'Plan ID is required.',
    invalid_type_error: 'Plan ID must be a string.',
  })
  .min(1, 'Plan ID cannot be empty.');

// ─── Lead creation request ────────────────────────────────────────────────────

export const createLeadSchema = z
  .object({
    customerName: customerNameSchema,
    mobileNumber: mobileNumberSchema,
    grossWeightGrams: grossWeightSchema,
    netWeightGrams: netWeightSchema,
    karat: karatSchema,
    selectedPlanId: planIdSchema,
    userId: z.string().optional(),
  })
  .refine((data) => data.netWeightGrams <= data.grossWeightGrams, {
    message: 'Net weight cannot exceed gross weight.',
    path: ['netWeightGrams'],
  });

export type CreateLeadRequest = z.infer<typeof createLeadSchema>;

// ─── Leads filter ─────────────────────────────────────────────────────────────

export const leadsFilterSchema = z.object({
  planId: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type LeadsFilter = z.infer<typeof leadsFilterSchema>;
