import { NextFunction, Request, Response } from 'express';
import { verifyPlayerToken } from '../lib/jwt';
import { ApiError } from './errorHandler';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(new ApiError(401, 'unauthorized', 'Missing bearer token'));
    return;
  }

  try {
    const payload = verifyPlayerToken(token);
    req.auth = { playerId: payload.sub };
    next();
  } catch {
    next(new ApiError(401, 'unauthorized', 'Invalid or expired token'));
  }
}
