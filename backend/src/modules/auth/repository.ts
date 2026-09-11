import { Pool } from 'pg';
import { PlayerRow } from '../../db/types';

export async function createGuestPlayer(pool: Pool): Promise<PlayerRow> {
  const { rows } = await pool.query<{ id: string; guest_number: string }>(
    "INSERT INTO players (display_name) VALUES ('') RETURNING id, guest_number",
  );
  const { id, guest_number } = rows[0];

  const { rows: updated } = await pool.query<PlayerRow>(
    'UPDATE players SET display_name = $2 WHERE id = $1 RETURNING *',
    [id, `Guest #${guest_number}`],
  );
  return updated[0];
}

export async function findPlayerById(pool: Pool, id: string): Promise<PlayerRow | null> {
  const { rows } = await pool.query<PlayerRow>('SELECT * FROM players WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function findPlayerByUsername(pool: Pool, username: string): Promise<PlayerRow | null> {
  const { rows } = await pool.query<PlayerRow>('SELECT * FROM players WHERE username = $1', [username]);
  return rows[0] ?? null;
}

export async function claimPlayer(
  pool: Pool,
  id: string,
  params: { username: string; passwordHash: string; email: string | null },
): Promise<PlayerRow> {
  const { rows } = await pool.query<PlayerRow>(
    `UPDATE players
     SET is_guest = false, username = $2, email = $3, password_hash = $4, display_name = $2
     WHERE id = $1
     RETURNING *`,
    [id, params.username, params.email, params.passwordHash],
  );
  return rows[0];
}
