import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

describe('guest signup rate limiting', () => {
  let pool: Pool;
  let redis: Redis;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    pool = createTestPool();
    redis = createTestRedis();
    await redis.flushdb();
    await resetSchema(pool);
    await runMigrations(pool, migrations);
    // Small override so the test doesn't need to make 100k requests to prove the cap works.
    app = createApp({ pool, redis, guestSignupsPerIpPerDay: 2 });
  });

  afterAll(async () => {
    await pool.end();
    redis.disconnect();
  });

  it('allows guest signups up to the per-IP cap, then 429s the next one', async () => {
    const first = await request(app).post('/api/auth/guest').send();
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/auth/guest').send();
    expect(second.status).toBe(201);

    const third = await request(app).post('/api/auth/guest').send();
    expect(third.status).toBe(429);
  });

  it('does not rate limit other auth routes', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'whatever1' });
    // Still processed (and correctly rejected for bad creds), not 429.
    expect(res.status).toBe(401);
  });
});
