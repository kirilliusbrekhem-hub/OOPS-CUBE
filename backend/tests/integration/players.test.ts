import { Pool } from 'pg';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';

describe('players routes', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;

  async function createGuestToken(): Promise<string> {
    const res = await request(app).post('/api/auth/guest').send();
    return res.body.token as string;
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

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/players/me');
    expect(res.status).toBe(401);
  });

  it('returns the current player profile', async () => {
    const token = await createGuestToken();
    const res = await request(app).get('/api/players/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.player).toMatchObject({ isGuest: true, balance: 0, runsCount: 0 });
  });

  it('updates display name', async () => {
    const token = await createGuestToken();
    const res = await request(app)
      .patch('/api/players/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Wall Dodger' });
    expect(res.status).toBe(200);
    expect(res.body.player.displayName).toBe('Wall Dodger');

    const fetched = await request(app).get('/api/players/me').set('Authorization', `Bearer ${token}`);
    expect(fetched.body.player.displayName).toBe('Wall Dodger');
  });

  it('rejects an empty display name', async () => {
    const token = await createGuestToken();
    const res = await request(app)
      .patch('/api/players/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: '' });
    expect(res.status).toBe(400);
  });
});
