import { Router } from 'express';
import type Redis from 'ioredis';
import { Pool } from 'pg';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import * as leaderboardService from './service';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function leaderboardRouter(pool: Pool, redis: Redis): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const parsed = querySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, 'validation_error', parsed.error.issues[0]?.message ?? 'Invalid query');
      }
      const page = await leaderboardService.getGlobalLeaderboard(pool, redis, parsed.data.limit, parsed.data.offset);
      res.json(page);
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', requireAuth, async (req, res, next) => {
    try {
      const rank = await leaderboardService.getMyRank(pool, req.auth!.playerId);
      if (!rank) {
        throw new ApiError(404, 'player_not_found', 'Player not found');
      }
      res.json(rank);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
