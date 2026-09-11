import { Router } from 'express';
import { Pool } from 'pg';
import { requireAuth } from '../../middleware/auth';
import * as questsService from './service';

export function questsRouter(pool: Pool): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const quests = await questsService.listQuests(pool, req.auth!.playerId);
      res.json({ quests });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/claim', async (req, res, next) => {
    try {
      const result = await questsService.claimQuest(pool, req.auth!.playerId, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
