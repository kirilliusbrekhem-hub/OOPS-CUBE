import { Router } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { requireAdminAuth } from '../../middleware/adminAuth';
import { ApiError } from '../../middleware/errorHandler';
import { validateBody } from '../../middleware/validate';
import { serializePlayer } from '../players/serialize';
import { creditCubes } from '../wallet/ledger';
import * as dailiesRepo from '../dailies/repository';
import * as questsRepo from '../quests/repository';
import * as topupRepo from '../topup/repository';
import { serializeOrder } from '../topup/serialize';
import * as walletRepo from '../wallet/repository';
import * as repo from './repository';
import * as adminService from './service';

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

const playersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const adjustBalanceSchema = z.object({ balanceDelta: z.number().int() });

const objectiveMetric = z.enum(['runs_played', 'cubes_earned', 'distance_per_run', 'best_score', 'leaderboard_rank']);
const dailyMetric = z.enum(['runs_played', 'cubes_earned', 'distance_per_run', 'best_score']);

const questCreateSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  metric: objectiveMetric,
  threshold: z.number().int().nullable(),
  target: z.number().int().min(1),
  rewardAmount: z.number().int().min(0),
  paysIn: z.enum(['cubes', 'future_token']),
});

const dailyCreateSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  metric: dailyMetric,
  threshold: z.number().int().nullable(),
  target: z.number().int().min(1),
  rewardAmount: z.number().int().min(0),
});

const objectiveUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  rewardAmount: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export function adminRouter(pool: Pool): Router {
  const router = Router();

  router.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
      const result = await adminService.login(pool, req.body.username, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.use(requireAdminAuth);

  router.get('/stats', async (_req, res, next) => {
    try {
      res.json(await repo.getStats(pool));
    } catch (err) {
      next(err);
    }
  });

  router.get('/players', async (req, res, next) => {
    try {
      const parsed = playersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ApiError(400, 'validation_error', parsed.error.issues[0]?.message ?? 'Invalid query');
      }
      const { players, total } = await repo.listPlayers(pool, parsed.data.search, parsed.data.limit, parsed.data.offset);
      res.json({ players: players.map(serializePlayer), total });
    } catch (err) {
      next(err);
    }
  });

  router.get('/players/:id', async (req, res, next) => {
    try {
      const player = await repo.getPlayerById(pool, req.params.id);
      if (!player) throw new ApiError(404, 'player_not_found', 'Player not found');
      res.json({ player: serializePlayer(player) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/players/:id', validateBody(adjustBalanceSchema), async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await repo.lockPlayer(client, req.params.id);
      if (!existing) throw new ApiError(404, 'player_not_found', 'Player not found');

      const player = await creditCubes(
        client,
        req.params.id,
        req.body.balanceDelta,
        'admin_adjustment',
        req.adminAuth!.adminId,
      );
      await client.query('COMMIT');
      res.json({ player: serializePlayer(player) });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err instanceof Error && 'code' in err && (err as { code?: string }).code === '23514') {
        next(new ApiError(400, 'invalid_adjustment', 'Adjustment would make balance negative'));
        return;
      }
      next(err);
    } finally {
      client.release();
    }
  });

  router.get('/quests', async (_req, res, next) => {
    try {
      res.json({ quests: await questsRepo.listAllQuests(pool) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/quests', validateBody(questCreateSchema), async (req, res, next) => {
    try {
      const quest = await questsRepo.createQuest(pool, req.body);
      res.status(201).json({ quest });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/quests/:id', validateBody(objectiveUpdateSchema), async (req, res, next) => {
    try {
      const quest = await questsRepo.updateQuest(pool, req.params.id, req.body);
      if (!quest) throw new ApiError(404, 'quest_not_found', 'Quest not found');
      res.json({ quest });
    } catch (err) {
      next(err);
    }
  });

  router.get('/dailies', async (_req, res, next) => {
    try {
      res.json({ dailyTasks: await dailiesRepo.listAllDailyTasks(pool) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/dailies', validateBody(dailyCreateSchema), async (req, res, next) => {
    try {
      const task = await dailiesRepo.createDailyTask(pool, req.body);
      res.status(201).json({ dailyTask: task });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/dailies/:id', validateBody(objectiveUpdateSchema), async (req, res, next) => {
    try {
      const task = await dailiesRepo.updateDailyTask(pool, req.params.id, req.body);
      if (!task) throw new ApiError(404, 'daily_task_not_found', 'Daily task not found');
      res.json({ dailyTask: task });
    } catch (err) {
      next(err);
    }
  });

  router.get('/topup-orders', async (req, res, next) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const { rows } = await pool.query(
        status
          ? 'SELECT * FROM topup_orders WHERE status = $1 ORDER BY created_at DESC LIMIT 100'
          : 'SELECT * FROM topup_orders ORDER BY created_at DESC LIMIT 100',
        status ? [status] : [],
      );
      res.json({ orders: rows.map(serializeOrder) });
    } catch (err) {
      next(err);
    }
  });

  // Manual stand-in for the not-yet-built Stripe webhook (see
  // src/modules/topup/router.ts TODO): lets an admin mark a pending order
  // paid and credit CUBES, e.g. for testing the top-up flow end to end
  // before a real payment provider exists.
  router.post('/topup-orders/:id/complete', async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const order = await topupRepo.lockOrder(client, req.params.id);
      if (!order) throw new ApiError(404, 'order_not_found', 'Top-up order not found');
      if (order.status !== 'pending') {
        throw new ApiError(409, 'order_not_pending', 'Order is not pending');
      }

      const completed = await topupRepo.markOrderCompleted(client, order.id);
      const player = await creditCubes(client, order.player_id, order.cubes_amount, 'topup', order.id);

      await client.query('COMMIT');
      res.json({ order: serializeOrder(completed), player: serializePlayer(player) });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  });

  router.get('/payout-requests', async (req, res, next) => {
    try {
      const status = req.query.status === 'pending' || req.query.status === 'paid' ? req.query.status : undefined;
      const requests = await walletRepo.listPayoutRequests(pool, status);
      res.json({
        requests: requests.map((r) => ({
          id: r.id,
          playerId: r.player_id,
          amount: r.amount,
          tonWalletAddress: r.ton_wallet_address,
          status: r.status,
          requestedAt: r.requested_at.toISOString(),
          paidAt: r.paid_at ? r.paid_at.toISOString() : null,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  // The admin sends real OP$ from their own wallet outside this app, then
  // marks the request paid here — no automated on-chain sending happens.
  router.post('/payout-requests/:id/mark-paid', async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const request = await walletRepo.lockPayoutRequest(client, req.params.id);
      if (!request) throw new ApiError(404, 'request_not_found', 'Payout request not found');
      if (request.status !== 'pending') {
        throw new ApiError(409, 'request_not_pending', 'Request is not pending');
      }
      const paid = await walletRepo.markPayoutRequestPaid(client, request.id);
      await client.query('COMMIT');
      res.json({
        request: {
          id: paid.id,
          playerId: paid.player_id,
          amount: paid.amount,
          tonWalletAddress: paid.ton_wallet_address,
          status: paid.status,
          requestedAt: paid.requested_at.toISOString(),
          paidAt: paid.paid_at ? paid.paid_at.toISOString() : null,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  });

  return router;
}
