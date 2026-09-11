import { PoolClient } from 'pg';
import { PlayerRow } from '../../db/types';

export type CubeReason = 'game_reward' | 'quest_reward' | 'daily_reward' | 'topup' | 'admin_adjustment';

export async function creditCubes(
  client: PoolClient,
  playerId: string,
  amount: number,
  reason: CubeReason,
  referenceId: string | null,
): Promise<PlayerRow> {
  if (amount !== 0) {
    await client.query(
      `INSERT INTO currency_ledger (player_id, amount, reason, reference_id) VALUES ($1, $2, $3, $4)`,
      [playerId, amount, reason, referenceId],
    );
  }
  const { rows } = await client.query<PlayerRow>(
    `UPDATE players SET balance = balance + $2 WHERE id = $1 RETURNING *`,
    [playerId, amount],
  );
  return rows[0];
}

export async function creditFutureToken(
  client: PoolClient,
  playerId: string,
  amount: number,
  source: string,
  referenceId: string | null,
): Promise<void> {
  if (amount <= 0) return;
  await client.query(
    `INSERT INTO future_token_ledger (player_id, amount, source, reference_id) VALUES ($1, $2, $3, $4)`,
    [playerId, amount, source, referenceId],
  );
}
