import { Router } from 'express';
import { Pool } from 'pg';
import { requireAuth } from '../../middleware/auth';
import * as shopService from './service';

export function shopRouter(pool: Pool): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/chests', (_req, res) => {
    res.json({ chests: shopService.listChests() });
  });

  router.post('/chests/:code/open', async (req, res, next) => {
    try {
      const result = await shopService.openChest(pool, req.auth!.playerId, req.params.code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
