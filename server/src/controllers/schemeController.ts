/**
 * Loan schemes controller.
 * GET /api/v1/loan-schemes — returns active schemes from the database.
 */

import type { Request, Response, NextFunction } from 'express';
import { getActiveSchemes } from '../repositories/schemeRepository';
import { sendSuccess } from '../utils/apiResponse';
import { MAX_LTV } from '../services/calculationService';

export async function getLoanSchemesController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schemes = await getActiveSchemes();

    const data = schemes.map((s) => {
      const ltvNum = parseFloat(s.maxLtv.toString());
      const effectiveLtv = Math.min(ltvNum, MAX_LTV);

      return {
        id: s.id,
        name: s.name,
        annualInterestRatePercent: parseFloat(s.annualInterestRate.toString()) * 100,
        tenureMonths: s.tenureMonths,
        maxLtvPercent: Math.round(effectiveLtv * 100),
        repaymentDescription: s.repaymentDescription,
      };
    });

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
