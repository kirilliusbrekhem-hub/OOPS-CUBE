import { Pool } from 'pg';
import { PlayerRow } from '../../db/types';

export async function touchAndGetPlayer(pool: Pool, id: string): Promise<PlayerRow | null> {
  const { rows } = await pool.query<PlayerRow>(
    'UPDATE players SET last_seen_at = now() WHERE id = $1 RETURNING *',
    [id],
  );
  return rows[0] ?? null;
}

export async function updateDisplayName(
  pool: Pool,
  id: string,
  displayName: string,
): Promise<PlayerRow | null> {
  const { rows } = await pool.query<PlayerRow>(
    'UPDATE players SET display_name = $2 WHERE id = $1 RETURNING *',
    [id, displayName],
  );
  return rows[0] ?? null;
}
