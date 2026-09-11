import { Pool, PoolClient } from 'pg';
import { GameSessionRow, PlayerRow } from '../../db/types';

export async function startSession(pool: Pool, playerId: string): Promise<GameSessionRow> {
  const { rows } = await pool.query<GameSessionRow>(
    'INSERT INTO game_sessions (player_id) VALUES ($1) RETURNING *',
    [playerId],
  );
  return rows[0];
}

export async function lockSession(client: PoolClient, sessionId: string): Promise<GameSessionRow | null> {
  const { rows } = await client.query<GameSessionRow>(
    'SELECT * FROM game_sessions WHERE id = $1 FOR UPDATE',
    [sessionId],
  );
  return rows[0] ?? null;
}

export async function applyCheckpoint(
  client: PoolClient,
  sessionId: string,
  scoreDelta: number,
  distanceDelta: number,
): Promise<GameSessionRow> {
  const { rows } = await client.query<GameSessionRow>(
    `UPDATE game_sessions
     SET server_score = server_score + $2,
         server_distance = server_distance + $3,
         last_checkpoint_at = now()
     WHERE id = $1
     RETURNING *`,
    [sessionId, scoreDelta, distanceDelta],
  );
  return rows[0];
}

export async function finalizeSession(
  client: PoolClient,
  sessionId: string,
  rewardAmount: number,
  idempotencyKey: string,
): Promise<GameSessionRow> {
  const { rows } = await client.query<GameSessionRow>(
    `UPDATE game_sessions
     SET status = 'ended', ended_at = now(), reward_amount = $2, idempotency_key = $3
     WHERE id = $1
     RETURNING *`,
    [sessionId, rewardAmount, idempotencyKey],
  );
  return rows[0];
}

export async function creditGameReward(
  client: PoolClient,
  playerId: string,
  sessionId: string,
  rewardAmount: number,
  serverScore: number,
  serverDistance: number,
): Promise<PlayerRow> {
  if (rewardAmount > 0) {
    await client.query(
      `INSERT INTO currency_ledger (player_id, amount, reason, reference_id) VALUES ($1, $2, 'game_reward', $3)`,
      [playerId, rewardAmount, sessionId],
    );
  }

  const { rows } = await client.query<PlayerRow>(
    `UPDATE players
     SET balance = balance + $2,
         best_score = GREATEST(best_score, $3),
         best_distance = GREATEST(best_distance, $4),
         runs_count = runs_count + 1
     WHERE id = $1
     RETURNING *`,
    [playerId, rewardAmount, serverScore, serverDistance],
  );
  return rows[0];
}

export async function getPlayer(client: PoolClient, playerId: string): Promise<PlayerRow | null> {
  const { rows } = await client.query<PlayerRow>('SELECT * FROM players WHERE id = $1', [playerId]);
  return rows[0] ?? null;
}
