import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

describe('quests, dailies and streak', () => {
  let pool: Pool;
  let redis: Redis;
  let app: ReturnType<typeof createApp>;

  async function authHeader(): Promise<string> {
    const res = await request(app).post('/api/auth/guest').send();
    return `Bearer ${res.body.token}`;
  }

  // Bypasses realistic anti-cheat checkpoint timing (covered separately in
  // game.test.ts) by setting the session's final server score/distance
  // directly, then ending it through the real endpoint — this is what
  // exercises the reward + quest/daily progress pipeline under test here.
  async function playRun(auth: string, serverScore: number, serverDistance: number, idemSuffix: string) {
    const startRes = await request(app).post('/api/game/sessions').set('Authorization', auth).send();
    const sessionId = startRes.body.sessionId as string;
    await pool.query('UPDATE game_sessions SET server_score = $2, server_distance = $3 WHERE id = $1', [
      sessionId,
      serverScore,
      serverDistance,
    ]);
    return request(app)
      .post(`/api/game/sessions/${sessionId}/end`)
      .set('Authorization', auth)
      .set('Idempotency-Key', `${idemSuffix}-${sessionId}`)
      .send();
  }

  async function insertRankQuest(threshold: number, code: string): Promise<string> {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO quests (code, title, metric, threshold, target, reward_amount, pays_in)
       VALUES ($1, 'Test rank quest', 'leaderboard_rank', $2, 1, 50, 'future_token')
       RETURNING id`,
      [code, threshold],
    );
    return rows[0].id;
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

  it('lists seeded quests and daily tasks with zero progress for a fresh player', async () => {
    const auth = await authHeader();
    const quests = await request(app).get('/api/quests').set('Authorization', auth);
    expect(quests.status).toBe(200);
    expect(quests.body.quests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'season_top_1000', paysIn: 'future_token', rewardAmount: 250 }),
      ]),
    );

    const dailies = await request(app).get('/api/dailies').set('Authorization', auth);
    expect(dailies.status).toBe(200);
    expect(dailies.body.tasks).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'daily_play_1_run', progress: 0, completed: false })]),
    );
    expect(dailies.body.streak).toMatchObject({ currentStreak: 0, bestStreak: 0 });
  });

  it('advances the "play 1 run" daily task and the streak after a single run, claimable once', async () => {
    const auth = await authHeader();
    await playRun(auth, 10, 5, 'run1');

    const dailies = await request(app).get('/api/dailies').set('Authorization', auth);
    const playTask = dailies.body.tasks.find((t: { code: string }) => t.code === 'daily_play_1_run');
    expect(playTask).toMatchObject({ progress: 1, completed: true, claimed: false });
    expect(dailies.body.streak).toMatchObject({ currentStreak: 1, bestStreak: 1 });

    const claim = await request(app)
      .post(`/api/dailies/${playTask.id}/claim`)
      .set('Authorization', auth)
      .send();
    expect(claim.status).toBe(200);
    expect(claim.body.player.balance).toBeGreaterThanOrEqual(100);

    const secondClaim = await request(app)
      .post(`/api/dailies/${playTask.id}/claim`)
      .set('Authorization', auth)
      .send();
    expect(secondClaim.status).toBe(409);
  });

  it('does not double count the streak for a second run on the same day', async () => {
    const auth = await authHeader();
    await playRun(auth, 5, 5, 'streak-a');
    await playRun(auth, 5, 5, 'streak-b');

    const dailies = await request(app).get('/api/dailies').set('Authorization', auth);
    expect(dailies.body.streak.currentStreak).toBe(1);
  });

  it('advances the "survive 1000m" daily task toward its target of 3 qualifying runs', async () => {
    const auth = await authHeader();
    await playRun(auth, 10, 1200, 'dist-1');
    await playRun(auth, 10, 1200, 'dist-2');

    const dailies = await request(app).get('/api/dailies').set('Authorization', auth);
    const surviveTask = dailies.body.tasks.find((t: { code: string }) => t.code === 'daily_survive_1000m');
    expect(surviveTask).toMatchObject({ progress: 2, completed: false });

    await playRun(auth, 10, 1200, 'dist-3');
    const dailies2 = await request(app).get('/api/dailies').set('Authorization', auth);
    const surviveTask2 = dailies2.body.tasks.find((t: { code: string }) => t.code === 'daily_survive_1000m');
    expect(surviveTask2).toMatchObject({ progress: 3, completed: true });
  });

  it('does not advance "survive 1000m" progress for a run that falls short of the distance', async () => {
    const auth = await authHeader();
    await playRun(auth, 10, 400, 'short-run');
    const dailies = await request(app).get('/api/dailies').set('Authorization', auth);
    const surviveTask = dailies.body.tasks.find((t: { code: string }) => t.code === 'daily_survive_1000m');
    expect(surviveTask).toMatchObject({ progress: 0, completed: false });
  });

  it('rejects claiming a leaderboard-rank quest whose threshold can never be met', async () => {
    const auth = await authHeader();
    const questId = await insertRankQuest(0, 'test_impossible_rank');

    const quests = await request(app).get('/api/quests').set('Authorization', auth);
    const testQuest = quests.body.quests.find((q: { id: string }) => q.id === questId);
    expect(testQuest.completed).toBe(false);

    const claim = await request(app).post(`/api/quests/${questId}/claim`).set('Authorization', auth).send();
    expect(claim.status).toBe(400);
  });

  it('allows claiming a leaderboard-rank quest once the player is within threshold, and pays future_token not cubes', async () => {
    const auth = await authHeader();
    const questId = await insertRankQuest(1_000_000, 'test_easy_rank');

    const quests = await request(app).get('/api/quests').set('Authorization', auth);
    const testQuest = quests.body.quests.find((q: { id: string }) => q.id === questId);
    expect(testQuest.completed).toBe(true);
    expect(testQuest.currentRank).toEqual(expect.any(Number));

    const before = await request(app).get('/api/players/me').set('Authorization', auth);
    const claim = await request(app).post(`/api/quests/${questId}/claim`).set('Authorization', auth).send();
    expect(claim.status).toBe(200);
    // Pays in future_token, not cubes: CUBES balance must be unaffected.
    expect(claim.body.player.balance).toBe(before.body.player.balance);

    const secondClaim = await request(app).post(`/api/quests/${questId}/claim`).set('Authorization', auth).send();
    expect(secondClaim.status).toBe(409);
  });
});
