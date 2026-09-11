import { Router } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import { validateBody } from '../../middleware/validate';
import * as repo from './repository';
import { serializePlayer } from './serialize';

const updateMeSchema = z.object({
  displayName: z.string().trim().min(1).max(24),
});

export function playersRouter(pool: Pool): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/me', async (req, res, next) => {
    try {
      const player = await repo.touchAndGetPlayer(pool, req.auth!.playerId);
      if (!player) {
        throw new ApiError(404, 'player_not_found', 'Player not found');
      }
      res.json({ player: serializePlayer(player) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/me', validateBody(updateMeSchema), async (req, res, next) => {
    try {
      const player = await repo.updateDisplayName(pool, req.auth!.playerId, req.body.displayName);
      if (!player) {
        throw new ApiError(404, 'player_not_found', 'Player not found');
      }
      res.json({ player: serializePlayer(player) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
