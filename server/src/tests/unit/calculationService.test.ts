import { describe, it, expect } from 'vitest';
import {
  calculatePureGoldGrams,
  calculateGoldValuePaise,
  calculateEligibleLoanPaise,
  calculateGoldQuote,
  maskMobileNumber,
  RATE_24K_PER_GRAM_RUPEES,
  paiseToRupees,
} from '../../services/calculationService';

// Mock scheme inputs as they come from Prisma
const mockSchemes = [
  {
    id: 'PLAN_BULLET_01',
    name: 'Bullet Repayment',
    annualInterestRate: 0.12,
    tenureMonths: 12,
    maxLtv: 0.70,
    repaymentDescription: 'Bullet',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'PLAN_EMI_01',
    name: 'Monthly EMI',
    annualInterestRate: 0.105,
    tenureMonths: 12,
    maxLtv: 0.75,
    repaymentDescription: 'EMI',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as any; // Type assertion since Prisma Decimal is tricky to mock perfectly in plain object

describe('Financial calculation service', () => {
  it('Test 1: 45g net, 22K, Monthly EMI', () => {
    const netWeightGrams = 45;
    const karat = 22;

    const pureGold = calculatePureGoldGrams(netWeightGrams, karat);
    expect(pureGold).toBeCloseTo(41.25, 4);

    const goldValuePaise = calculateGoldValuePaise(pureGold);
    expect(paiseToRupees(goldValuePaise)).toBe(288750);

    const eligibleLoanPaise = calculateEligibleLoanPaise(goldValuePaise, 0.75);
    expect(paiseToRupees(eligibleLoanPaise)).toBe(216562);
  });

  it('Test 2: 45g net, 22K, Bullet Repayment', () => {
    const netWeightGrams = 45;
    const karat = 22;

    const pureGold = calculatePureGoldGrams(netWeightGrams, karat);
    const goldValuePaise = calculateGoldValuePaise(pureGold);
    expect(paiseToRupees(goldValuePaise)).toBe(288750);

    const eligibleLoanPaise = calculateEligibleLoanPaise(goldValuePaise, 0.70);
    expect(paiseToRupees(eligibleLoanPaise)).toBe(202125);
  });

  it('Test 3: 10g net, 18K, Monthly EMI', () => {
    const netWeightGrams = 10;
    const karat = 18;

    const pureGold = calculatePureGoldGrams(netWeightGrams, karat);
    expect(pureGold).toBeCloseTo(7.5, 4);

    const goldValuePaise = calculateGoldValuePaise(pureGold);
    expect(paiseToRupees(goldValuePaise)).toBe(52500);

    const eligibleLoanPaise = calculateEligibleLoanPaise(goldValuePaise, 0.75);
    expect(paiseToRupees(eligibleLoanPaise)).toBe(39375);
  });

  it('should floor the eligible loan accurately', () => {
    // If goldValue * LTV has decimals, it should be floored in rupees
    const mockGoldValuePaise = 10050n; // 100.50 rupees
    const loanPaise = calculateEligibleLoanPaise(mockGoldValuePaise, 0.75);
    // 100.50 * 0.75 = 75.375
    // floor(75.375) = 75 rupees = 7500 paise
    expect(paiseToRupees(loanPaise)).toBe(75);
  });

  it('calculateGoldQuote returns full accurate payload', () => {
    const quote = calculateGoldQuote(50, 45, 22, mockSchemes);
    
    expect(quote.grossWeightGrams).toBe(50);
    expect(quote.netWeightGrams).toBe(45);
    expect(quote.karat).toBe(22);
    expect(quote.pureGoldGrams).toBeCloseTo(41.25, 4);
    expect(paiseToRupees(quote.goldValuePaise)).toBe(288750);

    const emiPlan = quote.schemes.find(s => s.schemeId === 'PLAN_EMI_01');
    expect(emiPlan).toBeDefined();
    expect(paiseToRupees(emiPlan!.eligibleLoanPaise)).toBe(216562);

    const bulletPlan = quote.schemes.find(s => s.schemeId === 'PLAN_BULLET_01');
    expect(bulletPlan).toBeDefined();
    expect(paiseToRupees(bulletPlan!.eligibleLoanPaise)).toBe(202125);
  });

  it('Mobile masking test', () => {
    expect(maskMobileNumber('9876543210')).toBe('9876XXXX10');
    expect(maskMobileNumber('12345')).toBe('XXXXXXXXXX'); // Fallback for invalid lengths
  });
});
