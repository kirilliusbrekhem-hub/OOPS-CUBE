import { Router } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
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

export function authRouter(pool: Pool): Router {
  const router = Router();

  router.post('/guest', async (_req, res, next) => {
    try {
      const { token, player } = await authService.bootstrapGuest(pool);
      res.status(201).json({ token, player: serializePlayer(player) });
    } catch (err) {
      next(err);
    }
  });

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
