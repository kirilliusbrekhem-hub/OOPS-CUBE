import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

const VALID_TON_ADDRESS = 'EQDkJ7JFweQazs_OFkvgLeGfv7B0Acn87bHbeytk5TbE179T';

describe('wallet routes (future-token ledger)', () => {
  let pool: Pool;
  let redis: Redis;
  let app: ReturnType<typeof createApp>;

  async function authHeader(): Promise<string> {
    const res = await request(app).post('/api/auth/guest').send();
    return `Bearer ${res.body.token}`;
  }

  beforeAll(async () => {
    pool = createTestPool();
    redis = createTestRedis();
    await redis.flushdb();
    await resetSchema(pool);
    await runMigrations(pool, migrations);
    app = createApp({ pool, redis });
  });

  afterAll(async () => {
    await pool.end();
    redis.disconnect();
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/wallet/future-token');
    expect(res.status).toBe(401);
  });

  it('starts at zero balance with empty history for a fresh player', async () => {
    const auth = await authHeader();
    const res = await request(app).get('/api/wallet/future-token').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ balance: 0, history: [] });
  });

  it('reflects a future_token quest claim in balance and history', async () => {
    const auth = await authHeader();
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO quests (code, title, metric, threshold, target, reward_amount, pays_in)
       VALUES ('test_wallet_rank', 'Test rank quest', 'leaderboard_rank', 1000000, 1, 77, 'future_token')
       RETURNING id`,
    );
    const questId = rows[0].id;

    const claim = await request(app).post(`/api/quests/${questId}/claim`).set('Authorization', auth).send();
    expect(claim.status).toBe(200);

    const res = await request(app).get('/api/wallet/future-token').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(77);
    expect(res.body.history).toHaveLength(1);
    expect(res.body.history[0]).toMatchObject({ amount: 77, source: 'quest', referenceId: questId, converted: false });
  });

  it('exposes the OP$ contract address without auth', async () => {
    const res = await request(app).get('/api/wallet/token-info');
    expect(res.status).toBe(200);
    expect(res.body.contractAddress).toEqual(expect.any(String));
    expect(res.body.contractAddress.length).toBeGreaterThan(0);
  });

  it('rejects an implausible TON address and accepts a well-formed one', async () => {
    const auth = await authHeader();
    const bad = await request(app).post('/api/wallet/ton-connect').set('Authorization', auth).send({ address: 'not-a-ton-address' });
    expect(bad.status).toBe(400);

    const good = await request(app).post('/api/wallet/ton-connect').set('Authorization', auth).send({ address: VALID_TON_ADDRESS });
    expect(good.status).toBe(200);
    expect(good.body.player.tonWalletAddress).toBe(VALID_TON_ADDRESS);
  });

  it('rejects a payout request without a connected wallet or with zero claimable balance', async () => {
    const auth = await authHeader();
    const noWallet = await request(app).post('/api/wallet/payout-request').set('Authorization', auth).send();
    expect(noWallet.status).toBe(400);
    expect(noWallet.body.error.code).toBe('wallet_not_connected');

    await request(app).post('/api/wallet/ton-connect').set('Authorization', auth).send({ address: VALID_TON_ADDRESS });
    const noBalance = await request(app).post('/api/wallet/payout-request').set('Authorization', auth).send();
    expect(noBalance.status).toBe(400);
    expect(noBalance.body.error.code).toBe('nothing_to_pay_out');
  });

  it('creates a payout request that reserves the claimable balance, and an admin can mark it paid', async () => {
    const auth = await authHeader();
    await request(app).post('/api/wallet/ton-connect').set('Authorization', auth).send({ address: VALID_TON_ADDRESS });

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO quests (code, title, metric, threshold, target, reward_amount, pays_in)
       VALUES ('test_payout_quest', 'Test payout quest', 'leaderboard_rank', 1000000, 1, 250, 'future_token')
       RETURNING id`,
    );
    const claim = await request(app).post(`/api/quests/${rows[0].id}/claim`).set('Authorization', auth).send();
    expect(claim.status).toBe(200);

    const requestRes = await request(app).post('/api/wallet/payout-request').set('Authorization', auth).send();
    expect(requestRes.status).toBe(201);
    expect(requestRes.body.request).toMatchObject({ amount: 250, tonWalletAddress: VALID_TON_ADDRESS, status: 'pending' });

    const afterBalance = await request(app).get('/api/wallet/future-token').set('Authorization', auth);
    expect(afterBalance.body.balance).toBe(0);

    const secondRequest = await request(app).post('/api/wallet/payout-request').set('Authorization', auth).send();
    expect(secondRequest.status).toBe(400);

    const passwordHash = await bcrypt.hash('adminpass123', 10);
    await pool.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', ['wallet-admin', passwordHash]);
    const adminLogin = await request(app).post('/api/admin/login').send({ username: 'wallet-admin', password: 'adminpass123' });
    const adminAuth = `Bearer ${adminLogin.body.token}`;

    const pending = await request(app).get('/api/admin/payout-requests?status=pending').set('Authorization', adminAuth);
    expect(pending.body.requests.some((r: { id: string }) => r.id === requestRes.body.request.id)).toBe(true);

    const markPaid = await request(app)
      .post(`/api/admin/payout-requests/${requestRes.body.request.id}/mark-paid`)
      .set('Authorization', adminAuth)
      .send();
    expect(markPaid.status).toBe(200);
    expect(markPaid.body.request.status).toBe('paid');

    const markAgain = await request(app)
      .post(`/api/admin/payout-requests/${requestRes.body.request.id}/mark-paid`)
      .set('Authorization', adminAuth)
      .send();
    expect(markAgain.status).toBe(409);
  });
});
