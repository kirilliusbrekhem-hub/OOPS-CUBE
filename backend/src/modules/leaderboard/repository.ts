import { Pool } from 'pg';

export interface LeaderboardRow {
  id: string;
  display_name: string;
  best_score: number;
  is_guest: boolean;
}

export interface RankedRow {
  id: string;
  display_name: string;
  best_score: number;
  rank: string; // bigint from window function comes back as string
}

export async function getTopPlayers(pool: Pool, limit: number, offset: number): Promise<LeaderboardRow[]> {
  const { rows } = await pool.query<LeaderboardRow>(
    `SELECT id, display_name, best_score, is_guest
     FROM players
     ORDER BY best_score DESC, id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return rows;
}

export async function countPlayers(pool: Pool): Promise<number> {
  const { rows } = await pool.query<{ count: string }>('SELECT count(*) FROM players');
  return Number(rows[0].count);
}

export async function getPlayerRank(pool: Pool, playerId: string): Promise<RankedRow | null> {
  const { rows } = await pool.query<RankedRow>(
    `SELECT id, display_name, best_score, rank FROM (
       SELECT id, display_name, best_score,
              ROW_NUMBER() OVER (ORDER BY best_score DESC, id ASC) AS rank
       FROM players
     ) ranked
     WHERE id = $1`,
    [playerId],
  );
  return rows[0] ?? null;
}
