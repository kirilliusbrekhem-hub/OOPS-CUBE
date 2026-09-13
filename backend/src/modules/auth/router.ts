import { Router } from 'express';
import type Redis from 'ioredis';
import { Pool } from 'pg';
import { z } from 'zod';
import { env } from '../../config/env';
import { requireAuth } from '../../middleware/auth';
import { rateLimitByPlayer } from '../../middleware/rateLimit';
import { validateBody } from '../../middleware/validate';
import { serializePlayer } from '../players/serialize';
import * as authService from './service';

const claimSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
  password: z.string().min(8).max(128),
  email: z.string().email().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export function authRouter(
  pool: Pool,
  redis: Redis,
  // Deters casual multi-accounting from a single device/network. Not a hard
  // one-account-per-human guarantee — shared IPs (offices, mobile carrier
  // NAT) legitimately host multiple real players, and a determined abuser
  // can still rotate networks. A real guarantee needs phone/ID verification,
  // which is a separate, bigger feature. Overridable (tests pass a small
  // number to exercise the 429 path deterministically).
  guestSignupsPerIpPerDay: number = env.guestSignupsPerIpPerDay,
): Router {
  const router = Router();

  router.post(
    '/guest',
    rateLimitByPlayer(redis, 'guest-signup', guestSignupsPerIpPerDay, 24 * 60 * 60),
    async (_req, res, next) => {
      try {
        const { token, player } = await authService.bootstrapGuest(pool);
        res.status(201).json({ token, player: serializePlayer(player) });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post('/claim', requireAuth, validateBody(claimSchema), async (req, res, next) => {
    try {
      const { token, player } = await authService.claimAccount(pool, req.auth!.playerId, req.body);
      res.json({ token, player: serializePlayer(player) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
      const { token, player } = await authService.login(pool, req.body);
      res.json({ token, player: serializePlayer(player) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
