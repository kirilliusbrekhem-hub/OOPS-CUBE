import { Pool } from 'pg';
import { env } from '../config/env';

export function createPool(connectionString: string = env.databaseUrl): Pool {
  return new Pool({ connectionString });
}

export const pool = createPool();
