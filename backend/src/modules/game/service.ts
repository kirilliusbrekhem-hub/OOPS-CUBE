import { Pool } from 'pg';
import { ApiError } from '../../middleware/errorHandler';
import { GameSessionRow, PlayerRow } from '../../db/types';
import { applySessionProgress } from '../progress/hook';
import * as repo from './repository';

// Anti-cheat bounds: server clamps client-reported deltas to what's
// physically plausible for this runner game, regardless of what the
// client claims.
const MAX_SCORE_PER_SEC = 50;
const MAX_DISTANCE_PER_SEC = 15;
const REWARD_PER_SCORE_POINT = 0.25;

export async function startSession(pool: Pool, playerId: string): Promise<GameSessionRow> {
  return repo.startSession(pool, playerId);
}

export async function checkpoint(
  pool: Pool,
  playerId: string,
  sessionId: string,
  scoreDelta: number,
  distanceDelta: number,
): Promise<GameSessionRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const session = await repo.lockSession(client, sessionId);
    if (!session || session.player_id !== playerId) {
      throw new ApiError(404, 'session_not_found', 'Game session not found');
    }
    if (session.status !== 'active') {
      throw new ApiError(409, 'session_ended', 'Game session has already ended');
    }

    const baseline = session.last_checkpoint_at ?? session.started_at;
    const elapsedSeconds = Math.max(0, (Date.now() - baseline.getTime()) / 1000);

    const clampedScoreDelta = Math.max(0, Math.min(scoreDelta, Math.ceil(MAX_SCORE_PER_SEC * elapsedSeconds) || 0));
    const clampedDistanceDelta = Math.max(
      0,
      Math.min(distanceDelta, Math.ceil(MAX_DISTANCE_PER_SEC * elapsedSeconds) || 0),
    );

    const updated = await repo.applyCheckpoint(client, sessionId, clampedScoreDelta, clampedDistanceDelta);
    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export interface EndSessionResult {
  session: GameSessionRow;
  player: PlayerRow;
}

export async function endSession(
  pool: Pool,
  playerId: string,
  sessionId: string,
  idempotencyKey: string,
): Promise<EndSessionResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const session = await repo.lockSession(client, sessionId);
    if (!session || session.player_id !== playerId) {
      throw new ApiError(404, 'session_not_found', 'Game session not found');
    }

    if (session.status === 'ended') {
      if (session.idempotency_key === idempotencyKey) {
        const player = await repo.getPlayer(client, playerId);
        await client.query('COMMIT');
        return { session, player: player! };
      }
      throw new ApiError(409, 'session_already_ended', 'Game session has already ended');
    }

    const rewardAmount = Math.floor(session.server_score * REWARD_PER_SCORE_POINT);
    const finalized = await repo.finalizeSession(client, sessionId, rewardAmount, idempotencyKey);
    const player = await repo.creditGameReward(
      client,
      playerId,
      sessionId,
      rewardAmount,
      finalized.server_score,
      finalized.server_distance,
    );
    await applySessionProgress(client, playerId, {
      serverScore: finalized.server_score,
      serverDistance: finalized.server_distance,
      rewardAmount,
    });

    await client.query('COMMIT');
    return { session: finalized, player };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof Error && 'code' in err && (err as { code?: string }).code === '23505') {
      throw new ApiError(409, 'idempotency_key_reused', 'Idempotency key was already used for a different session');
    }
    throw err;
  } finally {
    client.release();
  }
}
