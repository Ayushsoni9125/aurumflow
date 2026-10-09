import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { handleAiChat, handleAiChatStream } from '../ai/agent';
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

/**
 * Streaming AI Chat controller (Server-Sent Events)
 * Streams token chunks in real-time to minimize latency and waiting time.
 */
export async function aiChatStreamController(
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

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const writeEvent = (data: Record<string, any>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await handleAiChatStream(
        history,
        message,
        confirmationToken,
        {
          onStatus: (status) => {
            writeEvent({ type: 'status', status });
          },
          onChunk: (chunk) => {
            writeEvent({ type: 'chunk', text: chunk });
          }
        }
      );

      writeEvent({ type: 'done', text: result.text });
      res.end();
    } catch (err: any) {
      console.error('[AI Stream Error]', err);
      writeEvent({
        type: 'error',
        message: 'The AI assistant is temporarily unavailable. Please try again later.'
      });
      res.end();
    }
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data.', zodErrorToFields(err));
      return;
    }
    next(err);
  }
}

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
