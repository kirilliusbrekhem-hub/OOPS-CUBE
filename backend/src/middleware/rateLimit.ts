import { NextFunction, Request, Response } from 'express';
import type Redis from 'ioredis';
import { checkRateLimit } from '../lib/rateLimit';
import { ApiError } from './errorHandler';

export function rateLimitByPlayer(redis: Redis, bucket: string, limit: number, windowSeconds: number) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const playerId = req.auth?.playerId ?? req.ip ?? 'anonymous';
      const { allowed } = await checkRateLimit(redis, `ratelimit:${bucket}:${playerId}`, limit, windowSeconds);
      if (!allowed) {
        next(new ApiError(429, 'rate_limited', 'Too many requests, slow down'));
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
