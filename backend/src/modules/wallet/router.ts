import { Router } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { env } from '../../config/env';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import * as repo from './repository';
import * as walletService from './service';

const connectWalletSchema = z.object({ address: z.string().min(1) });

function serializeRequest(row: Awaited<ReturnType<typeof repo.createPayoutRequest>>) {
  return {
    id: row.id,
    amount: row.amount,
    tonWalletAddress: row.ton_wallet_address,
    status: row.status,
    requestedAt: row.requested_at.toISOString(),
    paidAt: row.paid_at ? row.paid_at.toISOString() : null,
  };
}

export function walletRouter(pool: Pool): Router {
  const router = Router();

  // Public: the contract address is not a secret, and the coin screen
  // needs it before the guest bootstrap necessarily resolves.
  router.get('/token-info', (_req, res) => {
    res.json({ contractAddress: env.opTokenContractAddress });
  });

  router.use(requireAuth);

  // Read-only accrual bookkeeping for OP$ — see future_token_ledger.
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

  // The address comes from the player's own wallet via TonConnect — their
  // wallet signs with their own key, which never reaches this server.
  router.post('/ton-connect', validateBody(connectWalletSchema), async (req, res, next) => {
    try {
      const result = await walletService.connectTonWallet(pool, req.auth!.playerId, req.body.address);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // No automated sending — see src/modules/wallet/service.ts. This just
  // queues a request for the project owner to fulfill manually.
  router.post('/payout-request', async (req, res, next) => {
    try {
      const { request } = await walletService.requestPayout(pool, req.auth!.playerId);
      res.status(201).json({ request: serializeRequest(request) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
