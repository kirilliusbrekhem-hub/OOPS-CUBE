import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

describe('leaderboard routes', () => {
  let pool: Pool;
  let redis: Redis;
  let app: ReturnType<typeof createApp>;

  async function createPlayerWithScore(score: number): Promise<{ id: string; token: string }> {
    const guestRes = await request(app).post('/api/auth/guest').send();
    const id = guestRes.body.player.id as string;
    const token = guestRes.body.token as string;
    await pool.query('UPDATE players SET best_score = $2 WHERE id = $1', [id, score]);
    return { id, token };
  }

  beforeAll(async () => {
    pool = createTestPool();
    redis = createTestRedis();
    await resetSchema(pool);
    await runMigrations(pool, migrations);
    app = createApp({ pool, redis });
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await pool.end();
    redis.disconnect();
  });

  it('is publicly readable without auth and orders by best_score desc', async () => {
    await createPlayerWithScore(500);
    const second = await createPlayerWithScore(9000);
    await createPlayerWithScore(100);

    const res = await request(app).get('/api/leaderboard?limit=10&offset=0');
    expect(res.status).toBe(200);
    expect(res.body.entries[0]).toMatchObject({ rank: 1, id: second.id, bestScore: 9000 });
    expect(res.body.totalPlayers).toBeGreaterThanOrEqual(3);
  });

  it('paginates with limit/offset', async () => {
    const res = await request(app).get('/api/leaderboard?limit=1&offset=1');
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].rank).toBe(2);
  });

  it('rejects an out-of-range limit', async () => {
    const res = await request(app).get('/api/leaderboard?limit=1000');
    expect(res.status).toBe(400);
  });

  it('requires auth for /me', async () => {
    const res = await request(app).get('/api/leaderboard/me');
    expect(res.status).toBe(401);
  });

  it('returns the authenticated player rank', async () => {
    const player = await createPlayerWithScore(15000);
    const res = await request(app).get('/api/leaderboard/me').set('Authorization', `Bearer ${player.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rank: 1, bestScore: 15000 });
  });
});
