/**
 * AurumFlow Seed Script
 * Seeds the required loan schemes for the application.
 * This script is idempotent — running it multiple times will not create duplicates.
 */

import { PrismaClient, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding AurumFlow loan schemes...');

  const schemes = [
    {
      id: 'PLAN_BULLET_01',
      name: 'Bullet Repayment',
      annualInterestRate: new Decimal('0.1200'), // 12.0%
      tenureMonths: 12,
      maxLtv: new Decimal('0.7000'), // 70%
      repaymentDescription: 'Principal plus interest paid in full at loan maturity',
      isActive: true,
    },
    {
      id: 'PLAN_EMI_01',
      name: 'Monthly EMI',
      annualInterestRate: new Decimal('0.1050'), // 10.5%
      tenureMonths: 12,
      maxLtv: new Decimal('0.7500'), // 75%
      repaymentDescription: 'Equal monthly instalments covering principal and interest',
      isActive: true,
    },
  ];

  for (const scheme of schemes) {
    const result = await prisma.loanScheme.upsert({
      where: { id: scheme.id },
      update: scheme,
      create: scheme,
    });
    console.log(`  ✅ Upserted scheme: ${result.id} — ${result.name}`);
  }

  console.log('👤 Seeding default demo users...');
  const bcrypt = await import('bcryptjs');
  
  const adminPasswordHash = await bcrypt.default.hash('admin', 10);
  const userPasswordHash = await bcrypt.default.hash('user', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aurumflow.com' },
    update: {
      password: adminPasswordHash,
      role: 'admin',
      name: 'Admin',
    },
    create: {
      email: 'admin@aurumflow.com',
      password: adminPasswordHash,
      role: 'admin',
      name: 'Admin',
    },
  });
  console.log(`  ✅ Upserted demo admin: ${admin.email} (role: ${admin.role})`);

  const user = await prisma.user.upsert({
    where: { email: 'user@aurumflow.com' },
    update: {
      password: userPasswordHash,
      role: 'user',
      name: 'Demo User',
    },
    create: {
      email: 'user@aurumflow.com',
      password: userPasswordHash,
      role: 'user',
      name: 'Demo User',
    },
  });
  console.log(`  ✅ Upserted demo user: ${user.email} (role: ${user.role})`);

  console.log('✅ Seeding complete.');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
