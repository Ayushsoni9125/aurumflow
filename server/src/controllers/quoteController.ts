/**
 * Quote controller.
 * POST /api/v1/quotes — calculates a quote without creating a lead.
 */

import type { Request, Response, NextFunction } from 'express';
import { quoteRequestSchema } from '../schemas';
import { getActiveSchemes } from '../repositories/schemeRepository';
import { calculateGoldQuote, paiseToRupees } from '../services/calculationService';
import { sendSuccess, sendError, zodErrorToFields } from '../utils/apiResponse';
import { ZodError } from 'zod';

export async function getQuoteController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = quoteRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Please correct the highlighted fields.',
        zodErrorToFields(parsed.error)
      );
      return;
    }

    const { grossWeightGrams, netWeightGrams, karat } = parsed.data;
    const schemes = await getActiveSchemes();

    if (schemes.length === 0) {
      sendError(res, 503, 'NO_SCHEMES', 'No active loan schemes are currently available.');
      return;
    }

    const quote = calculateGoldQuote(grossWeightGrams, netWeightGrams, karat, schemes);

    sendSuccess(res, {
      grossWeightGrams: quote.grossWeightGrams,
      netWeightGrams: quote.netWeightGrams,
      karat: quote.karat,
      pureGoldGrams: quote.pureGoldGrams,
      goldValueRupees: paiseToRupees(quote.goldValuePaise),
      mockRateDisclosure: quote.mockRateDisclosure,
      schemes: quote.schemes.map((s) => ({
        schemeId: s.schemeId,
        schemeName: s.schemeName,
        annualInterestRatePercent: s.annualInterestRatePercent,
        tenureMonths: s.tenureMonths,
        maxLtvPercent: s.maxLtvPercent,
        repaymentDescription: s.repaymentDescription,
        pureGoldGrams: s.pureGoldGrams,
        goldValueRupees: paiseToRupees(s.goldValuePaise),
        eligibleLoanRupees: paiseToRupees(s.eligibleLoanPaise),
      })),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data.', zodErrorToFields(err));
      return;
    }
    next(err);
  }
}
