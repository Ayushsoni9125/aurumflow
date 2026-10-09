import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aurumflow-secret-key-2026-secure-jwt';
const JWT_EXPIRES_IN = '7d';

export interface JwtUserPayload {
  id: string;
  email: string;
  role: string;
  name?: string | null;
}

export function generateToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtUserPayload {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
}
