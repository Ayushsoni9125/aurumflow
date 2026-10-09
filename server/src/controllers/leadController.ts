/**
 * Lead controller.
 * POST /api/v1/leads — creates a lead after validation and duplicate checks.
 * GET /api/v1/leads — returns leads.
 */

import type { Request, Response, NextFunction } from 'express';
import { createLeadSchema, leadsFilterSchema } from '../schemas';
import { getActiveSchemeById } from '../repositories/schemeRepository';
import { calculateGoldQuote, paiseToRupees } from '../services/calculationService';
import {
  createLead,
  getLeads,
  getLeadByApplicationId,
  DuplicateLeadError,
} from '../repositories/leadRepository';
import { generateApplicationId } from '../utils/applicationId';
import { sendSuccess, sendError, zodErrorToFields } from '../utils/apiResponse';
import { ZodError } from 'zod';

export async function createLeadController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createLeadSchema.safeParse(req.body);

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

    const {
      customerName,
      mobileNumber,
      grossWeightGrams,
      netWeightGrams,
      karat,
      selectedPlanId,
      userId,
    } = parsed.data;

    const effectiveUserId = (req as any).user?.id || userId;

    // Validate the plan
    const scheme = await getActiveSchemeById(selectedPlanId);
    if (!scheme) {
      sendError(res, 404, 'NOT_FOUND', 'The selected loan scheme does not exist or is inactive.');
      return;
    }

    // Recalculate on server - ignore any client figures
    const quote = calculateGoldQuote(grossWeightGrams, netWeightGrams, karat, [scheme]);
    const schemeQuote = quote.schemes[0];

    // Ensure we actually got a quote for this scheme
    if (!schemeQuote) {
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to calculate quote for the selected scheme.');
      return;
    }

    const applicationId = generateApplicationId();

    try {
      const lead = await createLead({
        applicationId,
        customerName,
        mobileNumber,
        grossWeightGrams,
        netWeightGrams,
        karat,
        schemeId: selectedPlanId,
        userId: effectiveUserId,
        pureGoldGrams: schemeQuote.pureGoldGrams,
        goldValuePaise: schemeQuote.goldValuePaise,
        eligibleLoanPaise: schemeQuote.eligibleLoanPaise,
        status: 'SUBMITTED',
      });

      sendSuccess(res, {
        applicationId: lead.applicationId,
        status: lead.status,
        pureGoldGrams: lead.pureGoldGrams.toNumber(),
        goldValueRupees: paiseToRupees(lead.goldValuePaise),
        eligibleLoanRupees: paiseToRupees(lead.eligibleLoanPaise),
      }, 201);
    } catch (err) {
      if (err instanceof DuplicateLeadError) {
        sendError(res, 409, 'CONFLICT', err.message, [
          { field: 'mobileNumber', message: `Application ${err.existingApplicationId} already exists.` },
        ]);
        // Also send existing app id in meta or a specific field if UI needs it easily
        return;
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data.', zodErrorToFields(err));
      return;
    }
    next(err);
  }
}

export async function getLeadsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = leadsFilterSchema.safeParse(req.query);

    if (!parsed.success) {
      sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Invalid query parameters.',
        zodErrorToFields(parsed.error)
      );
      return;
    }

    const { planId, userId, page, limit } = parsed.data;

    const { leads, total } = await getLeads(planId, userId, page, limit);

    sendSuccess(res, leads, 200, {
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLeadByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Application ID is required.');
      return;
    }

    const lead = await getLeadByApplicationId(id);

    if (!lead) {
      sendError(res, 404, 'NOT_FOUND', 'Application not found.');
      return;
    }

    sendSuccess(res, lead, 200);
  } catch (err) {
    next(err);
  }
}
