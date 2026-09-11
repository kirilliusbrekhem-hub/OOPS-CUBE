import { Pool } from 'pg';

export interface FutureTokenLedgerRow {
  id: string;
  player_id: string;
  amount: number;
  source: string;
  reference_id: string | null;
  accrued_at: Date;
  converted: boolean;
}

export async function getFutureTokenBalance(pool: Pool, playerId: string): Promise<number> {
  const { rows } = await pool.query<{ total: string | null }>(
    `SELECT SUM(amount) AS total FROM future_token_ledger WHERE player_id = $1 AND converted = false`,
    [playerId],
  );
  return Number(rows[0].total ?? 0);
}

export async function listFutureTokenHistory(pool: Pool, playerId: string): Promise<FutureTokenLedgerRow[]> {
  const { rows } = await pool.query<FutureTokenLedgerRow>(
    `SELECT * FROM future_token_ledger WHERE player_id = $1 ORDER BY accrued_at DESC LIMIT 100`,
    [playerId],
  );
  return rows;
}
