import { Pool, PoolClient } from 'pg';
import { AdminUserRow, PlayerRow } from '../../db/types';

export async function findAdminByUsername(pool: Pool, username: string): Promise<AdminUserRow | null> {
  const { rows } = await pool.query<AdminUserRow>('SELECT * FROM admin_users WHERE username = $1', [username]);
  return rows[0] ?? null;
}

export async function listPlayers(
  pool: Pool,
  search: string | undefined,
  limit: number,
  offset: number,
): Promise<{ players: PlayerRow[]; total: number }> {
  const pattern = search ? `%${search}%` : null;
  const where = pattern ? 'WHERE username ILIKE $3 OR display_name ILIKE $3' : '';
  const params = pattern ? [limit, offset, pattern] : [limit, offset];

  const { rows } = await pool.query<PlayerRow>(
    `SELECT * FROM players ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    params,
  );
  const { rows: countRows } = await pool.query<{ count: string }>(
    `SELECT count(*) FROM players ${pattern ? 'WHERE username ILIKE $1 OR display_name ILIKE $1' : ''}`,
    pattern ? [pattern] : [],
  );
  return { players: rows, total: Number(countRows[0].count) };
}

export async function getPlayerById(pool: Pool, id: string): Promise<PlayerRow | null> {
  const { rows } = await pool.query<PlayerRow>('SELECT * FROM players WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function lockPlayer(client: PoolClient, id: string): Promise<PlayerRow | null> {
  const { rows } = await client.query<PlayerRow>('SELECT * FROM players WHERE id = $1 FOR UPDATE', [id]);
  return rows[0] ?? null;
}

export interface AdminStats {
  totalPlayers: number;
  registeredPlayers: number;
  totalRuns: number;
  cubesIssued: number;
  sessionsToday: number;
  pendingTopupOrders: number;
}

export async function getStats(pool: Pool): Promise<AdminStats> {
  const { rows } = await pool.query<{
    total_players: string;
    registered_players: string;
    total_runs: string;
    cubes_issued: string;
    sessions_today: string;
    pending_topup_orders: string;
  }>(`
    SELECT
      (SELECT count(*) FROM players) AS total_players,
      (SELECT count(*) FROM players WHERE is_guest = false) AS registered_players,
      (SELECT count(*) FROM game_sessions WHERE status = 'ended') AS total_runs,
      (SELECT COALESCE(SUM(amount), 0) FROM currency_ledger WHERE amount > 0) AS cubes_issued,
      (SELECT count(*) FROM game_sessions WHERE started_at >= CURRENT_DATE) AS sessions_today,
      (SELECT count(*) FROM topup_orders WHERE status = 'pending') AS pending_topup_orders
  `);
  const row = rows[0];
  return {
    totalPlayers: Number(row.total_players),
    registeredPlayers: Number(row.registered_players),
    totalRuns: Number(row.total_runs),
    cubesIssued: Number(row.cubes_issued),
    sessionsToday: Number(row.sessions_today),
    pendingTopupOrders: Number(row.pending_topup_orders),
  };
}
