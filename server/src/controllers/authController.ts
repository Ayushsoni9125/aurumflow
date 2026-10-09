import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../repositories/prismaClient';
import { sendSuccess, sendError, zodErrorToFields } from '../utils/apiResponse';

const SALT_ROUNDS = 10;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid inputs', zodErrorToFields(parsed.error));
      return;
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 409, 'CONFLICT', 'User with this email already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
      },
    });

    sendSuccess(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 201);
  } catch (err) {
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid inputs', zodErrorToFields(parsed.error));
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendError(res, 404, 'NOT_FOUND', 'User not registered. Please sign up first.');
      return;
    }

    // Verify password with bcrypt
    let isPasswordValid = await bcrypt.compare(password, user.password).catch(() => false);

    // Fallback for legacy unhashed passwords: verify and auto-upgrade to bcrypt hash
    if (!isPasswordValid && user.password === password) {
      isPasswordValid = true;
      const rehashed = await bcrypt.hash(password, SALT_ROUNDS);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: rehashed },
      });
    }

    if (!isPasswordValid) {
      sendError(res, 401, 'UNAUTHORIZED', 'Incorrect email or password.');
      return;
    }

    sendSuccess(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 200);
  } catch (err) {
    next(err);
  }
}
