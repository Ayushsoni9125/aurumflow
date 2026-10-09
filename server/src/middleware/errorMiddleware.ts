/**
 * Central Express error handling middleware.
 * Catches all errors thrown from route handlers and formats them consistently.
 * Never exposes stack traces, database errors, or secrets in responses.
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError, zodErrorToFields } from '../utils/apiResponse';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Please correct the highlighted fields.',
      zodErrorToFields(err)
    );
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.fields);
    return;
  }

  // Log unexpected errors without exposing internals
  console.error('[AurumFlow] Unexpected error:', err instanceof Error ? err.message : 'Unknown error');

  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    'An unexpected error occurred. Please try again later.'
  );
}

/**
 * Async route wrapper that catches promise rejections and forwards to error middleware.
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
