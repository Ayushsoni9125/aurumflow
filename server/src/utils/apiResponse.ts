/**
 * Standard API response shapes for AurumFlow.
 * All responses follow this contract for consistency.
 */

import type { Response } from 'express';
import { ZodError } from 'zod';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: FieldError[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
): void {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  fields?: FieldError[]
): void {
  const body: ApiResponse = {
    success: false,
    error: { code, message, ...(fields ? { fields } : {}) },
  };
  res.status(statusCode).json(body);
}

export function zodErrorToFields(err: ZodError): FieldError[] {
  return err.errors.map((issue) => ({
    field: issue.path.join('.') || 'unknown',
    message: issue.message,
  }));
}
