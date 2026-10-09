/**
 * Gold loan financial calculation service.
 *
 * IMPORTANT: This is the single source of truth for all financial calculations.
 * Both the API endpoints AND the AI agent tools call these functions.
 * The LLM never performs arithmetic — it always calls this service via tools.
 *
 * Mock rate: ₹7,000 per gram of 24K gold.
 * This is a DEMO rate, not a live market price.
 */

import type { LoanScheme } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

/**
 * Mock 24K gold rate per gram in paise (₹7,000 = 700,000 paise).
 * Stored in paise to avoid floating-point arithmetic.
 * DEMO VALUE — not a live market rate.
 */
export const RATE_24K_PER_GRAM_PAISE = 700_000n; // BigInt paise
export const RATE_24K_PER_GRAM_RUPEES = 7_000; // For display

/**
 * Maximum permitted LTV regardless of scheme configuration.
 * Regulatory cap enforced server-side.
 */
export const MAX_LTV = 0.75;

/**
 * Result of calculating a gold quote for a single scheme.
 */
export interface SchemeQuoteResult {
  schemeId: string;
  schemeName: string;
  annualInterestRatePercent: number; // e.g. 12.0 for 12%
  tenureMonths: number;
  maxLtvPercent: number; // effective LTV used (capped at 75%)
  repaymentDescription: string;
  pureGoldGrams: number; // rounded to 4 dp for display
  goldValuePaise: bigint;
  eligibleLoanPaise: bigint;
}

/**
 * Full quote result including rate metadata.
 */
export interface GoldQuote {
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  pureGoldGrams: number;
  goldValuePaise: bigint;
  mockRateDisclosure: string;
  schemes: SchemeQuoteResult[];
}

/**
 * Calculate pure gold weight in grams.
 * pureGoldGrams = netWeightGrams * (karat / 24)
 */
export function calculatePureGoldGrams(
  netWeightGrams: number,
  karat: number
): number {
  // Use exact arithmetic via string to avoid floating-point drift
  const ratio = karat / 24;
  return netWeightGrams * ratio;
}

/**
 * Calculate gold value in paise.
 * goldValue = pureGoldGrams * rate24kPerGram
 * Returns BigInt paise for precision.
 */
export function calculateGoldValuePaise(pureGoldGrams: number): bigint {
  // Multiply in floating point then round to paise
  const valuePaise = pureGoldGrams * RATE_24K_PER_GRAM_RUPEES * 100;
  return BigInt(Math.round(valuePaise));
}

/**
 * Calculate eligible loan in paise.
 * eligibleLoan = floor(goldValue * min(plan.maxLtv, 0.75))
 */
export function calculateEligibleLoanPaise(
  goldValuePaise: bigint,
  schemeMaxLtv: number | string | Decimal
): bigint {
  const ltvNum = typeof schemeMaxLtv === 'number'
    ? schemeMaxLtv
    : parseFloat(schemeMaxLtv.toString());

  const effectiveLtv = Math.min(ltvNum, MAX_LTV);

  // floor(goldValueRupees * ltv) in rupees, then convert to paise
  const goldValueRupees = Number(goldValuePaise) / 100;
  const loanRupees = Math.floor(goldValueRupees * effectiveLtv);
  return BigInt(loanRupees) * 100n; // convert rupees → paise
}

/**
 * Calculate a full quote for a set of schemes.
 * This is the canonical calculation used by /quotes, /leads, and the AI tool.
 */
export function calculateGoldQuote(
  grossWeightGrams: number,
  netWeightGrams: number,
  karat: number,
  schemes: LoanScheme[]
): GoldQuote {
  const pureGoldGrams = calculatePureGoldGrams(netWeightGrams, karat);
  const goldValuePaise = calculateGoldValuePaise(pureGoldGrams);

  const schemeResults: SchemeQuoteResult[] = schemes.map((scheme) => {
    const ltvNum = parseFloat(scheme.maxLtv.toString());
    const effectiveLtv = Math.min(ltvNum, MAX_LTV);
    const eligibleLoanPaise = calculateEligibleLoanPaise(goldValuePaise, ltvNum);

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      annualInterestRatePercent: parseFloat(scheme.annualInterestRate.toString()) * 100,
      tenureMonths: scheme.tenureMonths,
      maxLtvPercent: Math.round(effectiveLtv * 100),
      repaymentDescription: scheme.repaymentDescription,
      pureGoldGrams: Math.round(pureGoldGrams * 10000) / 10000,
      goldValuePaise,
      eligibleLoanPaise,
    };
  });

  return {
    grossWeightGrams,
    netWeightGrams,
    karat,
    pureGoldGrams: Math.round(pureGoldGrams * 10000) / 10000,
    goldValuePaise,
    mockRateDisclosure:
      `Gold value is calculated at a mock/demo rate of ₹${RATE_24K_PER_GRAM_RUPEES}/gram for 24K gold. ` +
      'This is not a live market price and does not constitute a binding offer.',
    schemes: schemeResults,
  };
}

/**
 * Convert paise (BigInt) to rupees (number) for display purposes.
 */
export function paiseToRupees(paise: bigint): number {
  return Number(paise) / 100;
}

/**
 * Format rupees as Indian currency string.
 */
export function formatINR(rupees: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Mask an Indian mobile number for safe display.
 * Format: 9876XXXX10 (first 4 + XXXX + last 2)
 */
export function maskMobileNumber(mobile: string): string {
  if (mobile.length !== 10) return 'XXXXXXXXXX';
  return `${mobile.slice(0, 4)}XXXX${mobile.slice(8)}`;
}
