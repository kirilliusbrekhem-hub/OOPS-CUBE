import { Router } from 'express';
import { Pool } from 'pg';
import { requireAuth } from '../../middleware/auth';
import * as repo from './repository';

export function walletRouter(pool: Pool): Router {
  const router = Router();
  router.use(requireAuth);

  // Read-only: this is bookkeeping for a possible future on-chain token
  // (see future_token_ledger migration). No wallet connection, no
  // blockchain calls, nothing to sign here — just what's been accrued.
  router.get('/future-token', async (req, res, next) => {
    try {
      const [balance, history] = await Promise.all([
        repo.getFutureTokenBalance(pool, req.auth!.playerId),
        repo.listFutureTokenHistory(pool, req.auth!.playerId),
      ]);
      res.json({
        balance,
        history: history.map((row) => ({
          amount: row.amount,
          source: row.source,
          referenceId: row.reference_id,
          accruedAt: row.accrued_at.toISOString(),
          converted: row.converted,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
