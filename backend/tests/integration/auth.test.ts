import { Pool } from 'pg';
import request from 'supertest';
import { createApp } from '../../src/app';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';

describe('auth flows', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    pool = createTestPool();
    await resetSchema(pool);
    await runMigrations(pool, migrations);
    app = createApp({ pool });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates a guest player and issues a token', async () => {
    const res = await request(app).post('/api/auth/guest').send();
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.player).toMatchObject({
      isGuest: true,
      balance: 0,
      displayName: expect.stringMatching(/^Guest #\d+$/),
    });
  });

  it('rejects claim without a token', async () => {
    const res = await request(app)
      .post('/api/auth/claim')
      .send({ username: 'nouser', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('claims a guest account and can then log in with the new credentials', async () => {
    const guestRes = await request(app).post('/api/auth/guest').send();
    const token = guestRes.body.token as string;

    const claimRes = await request(app)
      .post('/api/auth/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'claimeduser', password: 'password123', email: 'user@example.com' });

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.player).toMatchObject({
      isGuest: false,
      username: 'claimeduser',
      displayName: 'claimeduser',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'claimeduser', password: 'password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.player.username).toBe('claimeduser');
    expect(loginRes.body.token).toEqual(expect.any(String));
  });

  it('rejects login with a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'claimeduser', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects claiming an already-claimed guest a second time', async () => {
    const guestRes = await request(app).post('/api/auth/guest').send();
    const token = guestRes.body.token as string;
    await request(app)
      .post('/api/auth/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'onceonly', password: 'password123' });

    const secondClaim = await request(app)
      .post('/api/auth/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'onceonly2', password: 'password123' });
    expect(secondClaim.status).toBe(409);
  });

  it('rejects claiming with a username that is already taken', async () => {
    const guestRes = await request(app).post('/api/auth/guest').send();
    const token = guestRes.body.token as string;
    const res = await request(app)
      .post('/api/auth/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'claimeduser', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('rejects requests with an invalid bearer token', async () => {
    const res = await request(app)
      .post('/api/auth/claim')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ username: 'whoever', password: 'password123' });
    expect(res.status).toBe(401);
  });
});
