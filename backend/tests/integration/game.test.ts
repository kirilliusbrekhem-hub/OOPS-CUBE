import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('game session routes', () => {
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

  it('rejects starting a session without auth', async () => {
    const res = await request(app).post('/api/game/sessions').send();
    expect(res.status).toBe(401);
  });

  it('starts a session for the authenticated player', async () => {
    const auth = await authHeader();
    const res = await request(app).post('/api/game/sessions').set('Authorization', auth).send();
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toEqual(expect.any(String));
  });

  it('clamps an implausibly large checkpoint delta reported immediately after start', async () => {
    const auth = await authHeader();
    const startRes = await request(app).post('/api/game/sessions').set('Authorization', auth).send();
    const sessionId = startRes.body.sessionId as string;

    const res = await request(app)
      .post(`/api/game/sessions/${sessionId}/checkpoint`)
      .set('Authorization', auth)
      .send({ scoreDelta: 100000, distanceDelta: 100000 });

    expect(res.status).toBe(200);
    // Elapsed time since session start is a few ms, so accepted delta must be tiny.
    expect(res.body.serverScore).toBeLessThan(50);
    expect(res.body.serverDistance).toBeLessThan(15);
  });

  it('accepts a plausible checkpoint delta after real elapsed time and clamps a second oversized one', async () => {
    const auth = await authHeader();
    const startRes = await request(app).post('/api/game/sessions').set('Authorization', auth).send();
    const sessionId = startRes.body.sessionId as string;

    await sleep(1100);

    const res = await request(app)
      .post(`/api/game/sessions/${sessionId}/checkpoint`)
      .set('Authorization', auth)
      .send({ scoreDelta: 100000, distanceDelta: 100000 });

    expect(res.status).toBe(200);
    // ~1.1s elapsed, MAX_SCORE_PER_SEC=50 / MAX_DISTANCE_PER_SEC=15 => clamped, not 100000.
    expect(res.body.serverScore).toBeGreaterThan(0);
    expect(res.body.serverScore).toBeLessThan(200);
    expect(res.body.serverDistance).toBeLessThan(60);
  }, 10000);

  it('rejects checkpointing a session that belongs to another player', async () => {
    const authA = await authHeader();
    const authB = await authHeader();
    const startRes = await request(app).post('/api/game/sessions').set('Authorization', authA).send();
    const sessionId = startRes.body.sessionId as string;

    const res = await request(app)
      .post(`/api/game/sessions/${sessionId}/checkpoint`)
      .set('Authorization', authB)
      .send({ scoreDelta: 10, distanceDelta: 5 });
    expect(res.status).toBe(404);
  });

  it('requires an Idempotency-Key header to end a session', async () => {
    const auth = await authHeader();
    const startRes = await request(app).post('/api/game/sessions').set('Authorization', auth).send();
    const sessionId = startRes.body.sessionId as string;

    const res = await request(app).post(`/api/game/sessions/${sessionId}/end`).set('Authorization', auth).send();
    expect(res.status).toBe(400);
  });

  it('ends a session, credits reward once, and is idempotent on retry with the same key', async () => {
    const auth = await authHeader();
    const startRes = await request(app).post('/api/game/sessions').set('Authorization', auth).send();
    const sessionId = startRes.body.sessionId as string;

    await sleep(500);
    await request(app)
      .post(`/api/game/sessions/${sessionId}/checkpoint`)
      .set('Authorization', auth)
      .send({ scoreDelta: 40, distanceDelta: 10 });

    const key = `end-${sessionId}`;
    const endRes = await request(app)
      .post(`/api/game/sessions/${sessionId}/end`)
      .set('Authorization', auth)
      .set('Idempotency-Key', key)
      .send();

    expect(endRes.status).toBe(200);
    const expectedReward = Math.floor(endRes.body.serverScore * 0.25);
    expect(endRes.body.rewardAmount).toBe(expectedReward);
    expect(endRes.body.player.balance).toBe(expectedReward);
    expect(endRes.body.player.runsCount).toBe(1);

    const retryRes = await request(app)
      .post(`/api/game/sessions/${sessionId}/end`)
      .set('Authorization', auth)
      .set('Idempotency-Key', key)
      .send();
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.player.balance).toBe(expectedReward);
    expect(retryRes.body.player.runsCount).toBe(1);
  }, 10000);

  it('rejects ending an already-ended session with a different idempotency key', async () => {
    const auth = await authHeader();
    const startRes = await request(app).post('/api/game/sessions').set('Authorization', auth).send();
    const sessionId = startRes.body.sessionId as string;

    await request(app)
      .post(`/api/game/sessions/${sessionId}/end`)
      .set('Authorization', auth)
      .set('Idempotency-Key', `first-${sessionId}`)
      .send();

    const res = await request(app)
      .post(`/api/game/sessions/${sessionId}/end`)
      .set('Authorization', auth)
      .set('Idempotency-Key', `second-${sessionId}`)
      .send();
    expect(res.status).toBe(409);
  });

  it('rate limits checkpoint spamming', async () => {
    const auth = await authHeader();
    const startRes = await request(app).post('/api/game/sessions').set('Authorization', auth).send();
    const sessionId = startRes.body.sessionId as string;

    const responses = await Promise.all(
      Array.from({ length: 15 }, () =>
        request(app)
          .post(`/api/game/sessions/${sessionId}/checkpoint`)
          .set('Authorization', auth)
          .send({ scoreDelta: 1, distanceDelta: 1 }),
      ),
    );
    expect(responses.some((r) => r.status === 429)).toBe(true);
  });
});
