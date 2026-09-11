import { Pool } from 'pg';
import { createPool } from '../../src/db/pool';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/oops_cube_test';

export function createTestPool(): Pool {
  return createPool(TEST_DATABASE_URL);
}

export async function resetSchema(pool: Pool): Promise<void> {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}
