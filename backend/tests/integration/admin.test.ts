import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

describe('admin routes', () => {
  let pool: Pool;
  let redis: Redis;
  let app: ReturnType<typeof createApp>;
  let adminToken: string;

  async function playerAuthHeader(): Promise<{ token: string; playerId: string }> {
    const res = await request(app).post('/api/auth/guest').send();
    return { token: res.body.token as string, playerId: res.body.player.id as string };
  }

  beforeAll(async () => {
    pool = createTestPool();
    redis = createTestRedis();
    await redis.flushdb();
    await resetSchema(pool);
    await runMigrations(pool, migrations);
    app = createApp({ pool, redis });

    const passwordHash = await bcrypt.hash('adminpass123', 10);
    await pool.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', ['root', passwordHash]);

    const loginRes = await request(app).post('/api/admin/login').send({ username: 'root', password: 'adminpass123' });
    adminToken = loginRes.body.token as string;
  });

  afterAll(async () => {
    await pool.end();
    redis.disconnect();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/admin/login').send({ username: 'root', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('logged in above and got a usable token', () => {
    expect(adminToken).toEqual(expect.any(String));
  });

  it('rejects admin routes without a token, and player tokens do not work here', async () => {
    const noAuth = await request(app).get('/api/admin/stats');
    expect(noAuth.status).toBe(401);

    const { token: playerToken } = await playerAuthHeader();
    const withPlayerToken = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${playerToken}`);
    expect(withPlayerToken.status).toBe(401);
  });

  it('returns platform stats', async () => {
    await playerAuthHeader();
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalPlayers: expect.any(Number),
      registeredPlayers: expect.any(Number),
      totalRuns: expect.any(Number),
      cubesIssued: expect.any(Number),
      sessionsToday: expect.any(Number),
      pendingTopupOrders: expect.any(Number),
    });
  });

  it('lists and paginates players', async () => {
    const res = await request(app).get('/api/admin/players?limit=1&offset=0').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.players).toHaveLength(1);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('adjusts a player balance up and down, and rejects going negative', async () => {
    const { playerId } = await playerAuthHeader();

    const up = await request(app)
      .patch(`/api/admin/players/${playerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ balanceDelta: 500 });
    expect(up.status).toBe(200);
    expect(up.body.player.balance).toBe(500);

    const down = await request(app)
      .patch(`/api/admin/players/${playerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ balanceDelta: -200 });
    expect(down.status).toBe(200);
    expect(down.body.player.balance).toBe(300);

    const tooFar = await request(app)
      .patch(`/api/admin/players/${playerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ balanceDelta: -10000 });
    expect(tooFar.status).toBe(400);

    const unchanged = await request(app).get('/api/players/me').set('Authorization', `Bearer ${(await playerAuthHeader()).token}`);
    expect(unchanged.status).toBe(200);
  });

  it('creates and updates a quest', async () => {
    const create = await request(app)
      .post('/api/admin/quests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'admin_test_quest',
        title: 'Admin test quest',
        metric: 'runs_played',
        threshold: null,
        target: 5,
        rewardAmount: 20,
        paysIn: 'cubes',
      });
    expect(create.status).toBe(201);
    const questId = create.body.quest.id as string;

    const update = await request(app)
      .patch(`/api/admin/quests/${questId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false, rewardAmount: 30 });
    expect(update.status).toBe(200);
    expect(update.body.quest).toMatchObject({ active: false, reward_amount: 30 });

    const list = await request(app).get('/api/admin/quests').set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.quests.some((q: { id: string }) => q.id === questId)).toBe(true);
  });

  it('creates and updates a daily task', async () => {
    const create = await request(app)
      .post('/api/admin/dailies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'admin_test_daily',
        title: 'Admin test daily',
        metric: 'cubes_earned',
        threshold: null,
        target: 100,
        rewardAmount: 10,
      });
    expect(create.status).toBe(201);
    const taskId = create.body.dailyTask.id as string;

    const update = await request(app)
      .patch(`/api/admin/dailies/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Renamed daily' });
    expect(update.status).toBe(200);
    expect(update.body.dailyTask.title).toBe('Renamed daily');
  });

  it('lists and completes a top-up order, crediting CUBES exactly once', async () => {
    const { token, playerId } = await playerAuthHeader();
    const orderRes = await request(app)
      .post('/api/topup/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageCode: 'starter', currency: 'RUB' });
    const orderId = orderRes.body.order.id as string;

    const pending = await request(app)
      .get('/api/admin/topup-orders?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pending.body.orders.some((o: { id: string }) => o.id === orderId)).toBe(true);

    const before = await request(app).get('/api/players/me').set('Authorization', `Bearer ${token}`);

    const complete = await request(app)
      .post(`/api/admin/topup-orders/${orderId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(complete.status).toBe(200);
    expect(complete.body.order.status).toBe('completed');
    expect(complete.body.player.balance).toBe(before.body.player.balance + 5000);
    expect(complete.body.player.id).toBe(playerId);

    const again = await request(app)
      .post(`/api/admin/topup-orders/${orderId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(again.status).toBe(409);

    const after = await request(app).get('/api/players/me').set('Authorization', `Bearer ${token}`);
    expect(after.body.player.balance).toBe(before.body.player.balance + 5000);
  });
});
