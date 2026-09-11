import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

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
});
