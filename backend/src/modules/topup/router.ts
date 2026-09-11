import { Router } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import { validateBody } from '../../middleware/validate';
import { findPackage, TOPUP_PACKAGES } from './packages';
import * as repo from './repository';
import { serializeOrder } from './serialize';

const createOrderSchema = z.object({
  packageCode: z.string(),
  currency: z.enum(['RUB', 'USD']),
});

export function topupRouter(pool: Pool): Router {
  const router = Router();

  router.get('/packages', (_req, res) => {
    res.json({ packages: TOPUP_PACKAGES });
  });

  // TODO(payments): wire up a real provider (e.g. Stripe Checkout + this
  // webhook to verify the signature and call topup/repository markOrderCompleted
  // inside a transaction that also credits CUBES via wallet/ledger creditCubes).
  // Intentionally unimplemented for MVP — no payment credentials exist yet.
  // Public (no player auth): a real provider calls this directly, verified
  // by its own request signature rather than our bearer token.
  router.post('/webhook/stripe', (_req, res) => {
    res.status(501).json({
      error: {
        code: 'not_implemented',
        message: 'Stripe webhook is not wired up yet. See TODO in src/modules/topup/router.ts.',
      },
    });
  });

  router.use(requireAuth);

  router.get('/orders', async (req, res, next) => {
    try {
      const orders = await repo.listOrdersForPlayer(pool, req.auth!.playerId);
      res.json({ orders: orders.map(serializeOrder) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/orders', validateBody(createOrderSchema), async (req, res, next) => {
    try {
      const pkg = findPackage(req.body.packageCode);
      if (!pkg) {
        throw new ApiError(404, 'package_not_found', 'Unknown top-up package');
      }
      const order = await repo.createOrder(pool, req.auth!.playerId, pkg, req.body.currency);
      res.status(201).json({
        order: serializeOrder(order),
        note: 'Design mockup — no real payment flow. Orders stay pending until a payment provider is wired up.',
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
