import { Pool } from 'pg';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';

describe('topup routes', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;

  async function authHeader(): Promise<string> {
    const res = await request(app).post('/api/auth/guest').send();
    return `Bearer ${res.body.token}`;
  }

  beforeAll(async () => {
    pool = createTestPool();
    await resetSchema(pool);
    await runMigrations(pool, migrations);
    app = createApp({ pool });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('lists packages without auth', async () => {
    const res = await request(app).get('/api/topup/packages');
    expect(res.status).toBe(200);
    expect(res.body.packages.length).toBeGreaterThan(0);
    expect(res.body.packages).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'best_value', featured: true })]),
    );
  });

  it('returns 501 for the unimplemented Stripe webhook', async () => {
    const res = await request(app).post('/api/topup/webhook/stripe').send({});
    expect(res.status).toBe(501);
  });

  it('exposes the SBP phone number without auth', async () => {
    const res = await request(app).get('/api/topup/payment-info');
    expect(res.status).toBe(200);
    expect(res.body.sbpPhoneNumber).toEqual(expect.any(String));
    expect(res.body.sbpPhoneNumber.length).toBeGreaterThan(0);
  });

  it('includes SBP transfer instructions for a RUB order but not for a USD one', async () => {
    const auth = await authHeader();
    const rub = await request(app)
      .post('/api/topup/orders')
      .set('Authorization', auth)
      .send({ packageCode: 'starter', currency: 'RUB' });
    expect(rub.body.note).toMatch(/SBP/);

    const usd = await request(app)
      .post('/api/topup/orders')
      .set('Authorization', auth)
      .send({ packageCode: 'starter', currency: 'USD' });
    expect(usd.body.note).not.toMatch(/SBP/);
  });

  it('requires auth to create an order', async () => {
    const res = await request(app).post('/api/topup/orders').send({ packageCode: 'starter', currency: 'RUB' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown package code', async () => {
    const auth = await authHeader();
    const res = await request(app)
      .post('/api/topup/orders')
      .set('Authorization', auth)
      .send({ packageCode: 'does_not_exist', currency: 'RUB' });
    expect(res.status).toBe(404);
  });

  it('creates a pending order that does not touch the balance', async () => {
    const auth = await authHeader();
    const before = await request(app).get('/api/players/me').set('Authorization', auth);

    const res = await request(app)
      .post('/api/topup/orders')
      .set('Authorization', auth)
      .send({ packageCode: 'starter', currency: 'RUB' });
    expect(res.status).toBe(201);
    expect(res.body.order).toMatchObject({
      packageCode: 'starter',
      cubesAmount: 5000,
      priceAmount: 19900, // kopecks
      priceCurrency: 'RUB',
      status: 'pending',
    });

    const after = await request(app).get('/api/players/me').set('Authorization', auth);
    expect(after.body.player.balance).toBe(before.body.player.balance);
  });

  it('lists the order in the player order history', async () => {
    const auth = await authHeader();
    await request(app)
      .post('/api/topup/orders')
      .set('Authorization', auth)
      .send({ packageCode: 'big_stack', currency: 'USD' });

    const res = await request(app).get('/api/topup/orders').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0]).toMatchObject({ packageCode: 'big_stack', priceCurrency: 'USD', status: 'pending' });
  });
});
