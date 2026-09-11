import { Router } from 'express';
import { Pool } from 'pg';
import { requireAuth } from '../../middleware/auth';
import * as dailiesService from './service';

export function dailiesRouter(pool: Pool): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const result = await dailiesService.listDailies(pool, req.auth!.playerId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/claim', async (req, res, next) => {
    try {
      const result = await dailiesService.claimDailyTask(pool, req.auth!.playerId, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
