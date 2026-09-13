import { Pool, PoolClient } from 'pg';
import { PlayerRow, TokenPayoutRequestRow } from '../../db/types';

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

export async function setTonWalletAddress(pool: Pool, playerId: string, address: string): Promise<PlayerRow> {
  const { rows } = await pool.query<PlayerRow>(
    'UPDATE players SET ton_wallet_address = $2 WHERE id = $1 RETURNING *',
    [playerId, address],
  );
  return rows[0];
}

/**
 * Sums the player's unconverted future-token rows. Postgres doesn't allow
 * FOR UPDATE with an aggregate, so this relies on the caller having already
 * locked the player row first (see wallet/service.ts requestPayout) to
 * serialize concurrent requests for the same player.
 */
export async function getUnconvertedFutureTokenTotal(client: PoolClient, playerId: string): Promise<number> {
  const { rows } = await client.query<{ total: string | null }>(
    `SELECT SUM(amount) AS total FROM future_token_ledger WHERE player_id = $1 AND converted = false`,
    [playerId],
  );
  return Number(rows[0].total ?? 0);
}

export async function markFutureTokenConverted(client: PoolClient, playerId: string): Promise<void> {
  await client.query('UPDATE future_token_ledger SET converted = true WHERE player_id = $1 AND converted = false', [
    playerId,
  ]);
}

export async function createPayoutRequest(
  client: PoolClient,
  playerId: string,
  amount: number,
  tonWalletAddress: string,
): Promise<TokenPayoutRequestRow> {
  const { rows } = await client.query<TokenPayoutRequestRow>(
    `INSERT INTO token_payout_requests (player_id, amount, ton_wallet_address) VALUES ($1, $2, $3) RETURNING *`,
    [playerId, amount, tonWalletAddress],
  );
  return rows[0];
}

export async function listPayoutRequests(pool: Pool, status?: 'pending' | 'paid'): Promise<TokenPayoutRequestRow[]> {
  const { rows } = await pool.query<TokenPayoutRequestRow>(
    status
      ? 'SELECT * FROM token_payout_requests WHERE status = $1 ORDER BY requested_at DESC LIMIT 100'
      : 'SELECT * FROM token_payout_requests ORDER BY requested_at DESC LIMIT 100',
    status ? [status] : [],
  );
  return rows;
}

export async function lockPayoutRequest(client: PoolClient, id: string): Promise<TokenPayoutRequestRow | null> {
  const { rows } = await client.query<TokenPayoutRequestRow>(
    'SELECT * FROM token_payout_requests WHERE id = $1 FOR UPDATE',
    [id],
  );
  return rows[0] ?? null;
}

export async function markPayoutRequestPaid(client: PoolClient, id: string): Promise<TokenPayoutRequestRow> {
  const { rows } = await client.query<TokenPayoutRequestRow>(
    `UPDATE token_payout_requests SET status = 'paid', paid_at = now() WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0];
}
