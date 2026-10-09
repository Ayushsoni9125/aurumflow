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
