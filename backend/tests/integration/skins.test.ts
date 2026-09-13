import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

describe('cube skins routes', () => {
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
    const res = await request(app).get('/api/skins');
    expect(res.status).toBe(401);
  });

  it('lists skins with the free classic skin already owned', async () => {
    const auth = await authHeader();
    const res = await request(app).get('/api/skins').set('Authorization', auth);
    expect(res.status).toBe(200);
    const classic = res.body.skins.find((s: { code: string }) => s.code === 'classic');
    expect(classic).toMatchObject({ priceCubes: 0, owned: true });
    const plasma = res.body.skins.find((s: { code: string }) => s.code === 'plasma');
    expect(plasma).toMatchObject({ priceCubes: 2500, owned: false });
  });

  it('rejects purchasing a skin without enough balance', async () => {
    const auth = await authHeader();
    const skins = await request(app).get('/api/skins').set('Authorization', auth);
    const plasma = skins.body.skins.find((s: { code: string }) => s.code === 'plasma');

    const res = await request(app).post(`/api/skins/${plasma.id}/purchase`).set('Authorization', auth).send();
    expect(res.status).toBe(400);
  });

  it('rejects equipping a skin that is not owned', async () => {
    const auth = await authHeader();
    const skins = await request(app).get('/api/skins').set('Authorization', auth);
    const plasma = skins.body.skins.find((s: { code: string }) => s.code === 'plasma');

    const res = await request(app).post(`/api/skins/${plasma.id}/equip`).set('Authorization', auth).send();
    expect(res.status).toBe(403);
  });

  it('purchases a skin once balance is sufficient, then equips it, and cannot be bought twice', async () => {
    const guestRes = await request(app).post('/api/auth/guest').send();
    const token = guestRes.body.token as string;
    const playerId = guestRes.body.player.id as string;
    const auth = `Bearer ${token}`;

    await pool.query('UPDATE players SET balance = 5000 WHERE id = $1', [playerId]);

    const skins = await request(app).get('/api/skins').set('Authorization', auth);
    const plasma = skins.body.skins.find((s: { code: string }) => s.code === 'plasma');

    const purchase = await request(app).post(`/api/skins/${plasma.id}/purchase`).set('Authorization', auth).send();
    expect(purchase.status).toBe(200);
    expect(purchase.body.player.balance).toBe(2500);

    const equip = await request(app).post(`/api/skins/${plasma.id}/equip`).set('Authorization', auth).send();
    expect(equip.status).toBe(200);
    expect(equip.body.player.equippedSkinId).toBe(plasma.id);

    const secondPurchase = await request(app).post(`/api/skins/${plasma.id}/purchase`).set('Authorization', auth).send();
    expect(secondPurchase.status).toBe(409);
  });

  it('always allows equipping the free classic skin', async () => {
    const auth = await authHeader();
    const skins = await request(app).get('/api/skins').set('Authorization', auth);
    const classic = skins.body.skins.find((s: { code: string }) => s.code === 'classic');

    const res = await request(app).post(`/api/skins/${classic.id}/equip`).set('Authorization', auth).send();
    expect(res.status).toBe(200);
  });
});
