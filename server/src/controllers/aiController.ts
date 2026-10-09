import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { handleAiChat } from '../ai/agent';
import { sendSuccess, sendError, zodErrorToFields } from '../utils/apiResponse';
import { ZodError } from 'zod';

import prisma from '../repositories/prismaClient';

const chatRequestSchema = z.object({
  userId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).default([]),
  message: z.string().min(1, 'Message cannot be empty'),
  confirmationToken: z.string().optional(),
});

export async function aiChatController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Invalid chat request.',
        zodErrorToFields(parsed.error)
      );
      return;
    }

    const { history, message, confirmationToken, userId } = parsed.data;

    // Check if user is authenticated
    if (!userId) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication is required to use the AI Assistant. Please sign in.');
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Valid user account is required to use the AI Assistant.');
      return;
    }

    try {
      const response = await handleAiChat(history, message, confirmationToken);
      
      sendSuccess(res, {
        text: response.text,
      });
    } catch (err: any) {
      console.error('[AI Error]', err);
      // Don't leak AI API errors to client, return a friendly message
      sendError(res, 503, 'AI_UNAVAILABLE', 'The AI assistant is temporarily unavailable. Please try again later.');
    }
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data.', zodErrorToFields(err));
      return;
    }
    next(err);
  }
}
