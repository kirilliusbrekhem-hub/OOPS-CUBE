import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const EXPIRES_IN = '30d';

export interface PlayerTokenPayload {
  sub: string;
}

export function signPlayerToken(playerId: string): string {
  return jwt.sign({ sub: playerId }, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyPlayerToken(token: string): PlayerTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub: decoded.sub };
}

const ADMIN_EXPIRES_IN = '12h';

export interface AdminTokenPayload {
  sub: string;
}

export function signAdminToken(adminId: string): string {
  return jwt.sign({ sub: adminId }, env.adminJwtSecret, { expiresIn: ADMIN_EXPIRES_IN });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  const decoded = jwt.verify(token, env.adminJwtSecret);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub: decoded.sub };
}
