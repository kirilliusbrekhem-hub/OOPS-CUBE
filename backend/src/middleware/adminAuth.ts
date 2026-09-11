import { NextFunction, Request, Response } from 'express';
import { verifyAdminToken } from '../lib/jwt';
import { ApiError } from './errorHandler';

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(new ApiError(401, 'unauthorized', 'Missing bearer token'));
    return;
  }

  try {
    const payload = verifyAdminToken(token);
    req.adminAuth = { adminId: payload.sub };
    next();
  } catch {
    next(new ApiError(401, 'unauthorized', 'Invalid or expired admin token'));
  }
}
