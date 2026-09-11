import { Router } from 'express';
import { Pool } from 'pg';
import type Redis from 'ioredis';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import { rateLimitByPlayer } from '../../middleware/rateLimit';
import { validateBody } from '../../middleware/validate';
import { serializePlayer } from '../players/serialize';
import * as gameService from './service';

const checkpointSchema = z.object({
  scoreDelta: z.number().int().min(0).max(100000),
  distanceDelta: z.number().int().min(0).max(100000),
});

export function gameRouter(pool: Pool, redis: Redis): Router {
  const router = Router();
  router.use(requireAuth);

  router.post('/sessions', rateLimitByPlayer(redis, 'game-start', 20, 60), async (req, res, next) => {
    try {
      const session = await gameService.startSession(pool, req.auth!.playerId);
      res.status(201).json({ sessionId: session.id, startedAt: session.started_at });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/sessions/:id/checkpoint',
    rateLimitByPlayer(redis, 'checkpoint', 10, 2),
    validateBody(checkpointSchema),
    async (req, res, next) => {
      try {
        const session = await gameService.checkpoint(
          pool,
          req.auth!.playerId,
          req.params.id,
          req.body.scoreDelta,
          req.body.distanceDelta,
        );
        res.json({ serverScore: session.server_score, serverDistance: session.server_distance });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post('/sessions/:id/end', rateLimitByPlayer(redis, 'game-end', 20, 60), async (req, res, next) => {
    try {
      const idempotencyKey = req.header('Idempotency-Key');
      if (!idempotencyKey) {
        throw new ApiError(400, 'missing_idempotency_key', 'Idempotency-Key header is required');
      }

      const { session, player } = await gameService.endSession(
        pool,
        req.auth!.playerId,
        req.params.id,
        idempotencyKey,
      );
      res.json({
        serverScore: session.server_score,
        serverDistance: session.server_distance,
        rewardAmount: session.reward_amount,
        player: serializePlayer(player),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
