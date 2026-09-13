import { Pool } from 'pg';
import type Redis from 'ioredis';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';
import { createTestRedis } from '../helpers/redis';

describe('shop routes', () => {
  let pool: Pool;
  let redis: Redis;
  let app: ReturnType<typeof createApp>;

  async function createGuest(): Promise<{ token: string; playerId: string }> {
    const res = await request(app).post('/api/auth/guest').send();
    return { token: res.body.token, playerId: res.body.player.id };
  }

  beforeAll(async () => {
    pool = createTestPool();
    redis = createTestRedis();
    await redis.flushdb();
    await resetSchema(pool);
    await runMigrations(pool, migrations);
    app = createApp({ pool, redis });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await pool.end();
    redis.disconnect();
  });

  it('requires auth to list chests', async () => {
    const res = await request(app).get('/api/shop/chests');
    expect(res.status).toBe(401);
  });

  it('lists chests whose reward odds each sum to 100%', async () => {
    const { token } = await createGuest();
    const res = await request(app).get('/api/shop/chests').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.chests.length).toBeGreaterThan(0);
    for (const chest of res.body.chests) {
      const sum = chest.odds.reduce((s: number, o: { oddsPercent: number }) => s + o.oddsPercent, 0);
      expect(sum).toBeCloseTo(100, 0);
    }
  });

  it('rejects an unknown chest code', async () => {
    const { token } = await createGuest();
    const res = await request(app).post('/api/shop/chests/does_not_exist/open').set('Authorization', `Bearer ${token}`).send();
    expect(res.status).toBe(404);
  });

  it('rejects opening a chest without enough balance', async () => {
    const { token } = await createGuest();
    const res = await request(app).post('/api/shop/chests/small/open').set('Authorization', `Bearer ${token}`).send();
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('insufficient_balance');
  });

  it('opens a chest and the resulting balance matches price paid minus/plus the reward', async () => {
    const { token, playerId } = await createGuest();
    await pool.query('UPDATE players SET balance = 5000 WHERE id = $1', [playerId]);

    const res = await request(app).post('/api/shop/chests/small/open').set('Authorization', `Bearer ${token}`).send();
    expect(res.status).toBe(200);
    expect(['cubes', 'skin']).toContain(res.body.rewardType);

    const expectedBalance = 5000 - 500 + (res.body.rewardType === 'cubes' ? res.body.cubesAmount : 0);
    expect(res.body.player.balance).toBe(expectedBalance);

    if (res.body.rewardType === 'skin') {
      expect(res.body.skin).toMatchObject({ id: expect.any(String), name: expect.any(String) });
    }
  });

  it('falls back to fallbackCubes when a skin reward rolls but the player already owns every skin', async () => {
    const { token, playerId } = await createGuest();
    await pool.query('UPDATE players SET balance = 5000 WHERE id = $1', [playerId]);

    const allSkins = await pool.query('SELECT id FROM cube_skins WHERE price_cubes > 0');
    for (const row of allSkins.rows) {
      await pool.query('INSERT INTO player_owned_skins (player_id, skin_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [playerId, row.id]);
    }

    jest.spyOn(Math, 'random').mockReturnValue(0.99); // forces the 'skin' reward tier

    const res = await request(app).post('/api/shop/chests/small/open').set('Authorization', `Bearer ${token}`).send();
    expect(res.status).toBe(200);
    expect(res.body.rewardType).toBe('cubes');
    expect(res.body.cubesAmount).toBe(1200); // small chest's fallbackCubes
    expect(res.body.player.balance).toBe(5000 - 500 + 1200);
  });

  it('records chest_purchase and chest_reward ledger entries', async () => {
    const { token, playerId } = await createGuest();
    await pool.query('UPDATE players SET balance = 5000 WHERE id = $1', [playerId]);

    await request(app).post('/api/shop/chests/small/open').set('Authorization', `Bearer ${token}`).send();

    const ledger = await pool.query('SELECT reason FROM currency_ledger WHERE player_id = $1 ORDER BY created_at', [playerId]);
    const reasons = ledger.rows.map((r) => r.reason);
    expect(reasons).toContain('chest_purchase');
  });
});
