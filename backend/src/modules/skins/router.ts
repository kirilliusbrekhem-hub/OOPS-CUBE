import { Router } from 'express';
import { Pool } from 'pg';
import { requireAuth } from '../../middleware/auth';
import * as skinsService from './service';

export function skinsRouter(pool: Pool): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const skins = await skinsService.listSkins(pool, req.auth!.playerId);
      res.json({ skins });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/purchase', async (req, res, next) => {
    try {
      const result = await skinsService.purchaseSkin(pool, req.auth!.playerId, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/equip', async (req, res, next) => {
    try {
      const result = await skinsService.equipSkin(pool, req.auth!.playerId, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
