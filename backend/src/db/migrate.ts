import { Pool } from 'pg';
import { pool as defaultPool } from './pool';

export interface Migration {
  id: string;
  sql: string;
}

export async function runMigrations(pool: Pool, migrations: Migration[]): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await pool.query<{ id: string }>('SELECT id FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.id));
  const newlyApplied: string[] = [];

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
      await client.query('COMMIT');
      newlyApplied.push(migration.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${migration.id} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }

  return newlyApplied;
}

/* istanbul ignore if -- CLI entrypoint, exercised via `npm run migrate` not unit tests */
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { migrations } = require('./migrations');
  runMigrations(defaultPool, migrations)
    .then((applied) => {
      // eslint-disable-next-line no-console
      console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'No pending migrations');
      return defaultPool.end();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    });
}
