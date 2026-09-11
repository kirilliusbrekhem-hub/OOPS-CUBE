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
