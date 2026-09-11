import { Pool } from 'pg';
import { runMigrations } from '../../src/db/migrate';
import { migrations } from '../../src/db/migrations';
import { createTestPool, resetSchema } from '../helpers/db';

describe('runMigrations', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = createTestPool();
    await resetSchema(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('applies all migrations and creates expected tables', async () => {
    const applied = await runMigrations(pool, migrations);
    expect(applied).toEqual(migrations.map((m) => m.id));

    const { rows } = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    );
    const tableNames = rows.map((r) => r.table_name);
    expect(tableNames).toEqual(
      expect.arrayContaining(['players', 'currency_ledger', 'schema_migrations']),
    );
  });

  it('is idempotent — re-running applies nothing new', async () => {
    const applied = await runMigrations(pool, migrations);
    expect(applied).toEqual([]);
  });

  it('enforces players.balance >= 0 and currency_ledger.reason whitelist', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO players (display_name) VALUES ('Guest #1') RETURNING id`,
    );
    const playerId = rows[0].id;

    await expect(
      pool.query('UPDATE players SET balance = -1 WHERE id = $1', [playerId]),
    ).rejects.toThrow();

    await expect(
      pool.query(
        `INSERT INTO currency_ledger (player_id, amount, reason) VALUES ($1, 100, 'not_a_real_reason')`,
        [playerId],
      ),
    ).rejects.toThrow();

    await pool.query(
      `INSERT INTO currency_ledger (player_id, amount, reason) VALUES ($1, 100, 'game_reward')`,
      [playerId],
    );
    const { rows: ledgerRows } = await pool.query(
      'SELECT amount, reason FROM currency_ledger WHERE player_id = $1',
      [playerId],
    );
    expect(ledgerRows).toEqual([{ amount: '100', reason: 'game_reward' }]);
  });
});
