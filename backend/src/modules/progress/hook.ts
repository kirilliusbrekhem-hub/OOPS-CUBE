import { PoolClient } from 'pg';
import * as dailiesRepo from '../dailies/repository';
import * as questsRepo from '../quests/repository';

export interface SessionProgressEvent {
  serverScore: number;
  serverDistance: number;
  rewardAmount: number;
}

/**
 * Advances quest/daily-task progress and the login streak from inside the
 * game session's own end-of-run transaction, so it commits or rolls back
 * atomically with the currency reward.
 */
export async function applySessionProgress(
  client: PoolClient,
  playerId: string,
  event: SessionProgressEvent,
): Promise<void> {
  await questsRepo.advanceQuestProgress(client, playerId, 'runs_played', 1, null);
  await questsRepo.advanceQuestProgress(client, playerId, 'cubes_earned', event.rewardAmount, null);
  await questsRepo.advanceQuestProgress(client, playerId, 'distance_per_run', 1, event.serverDistance);
  await questsRepo.advanceQuestProgress(client, playerId, 'best_score', 1, event.serverScore);

  await dailiesRepo.advanceDailyProgress(client, playerId, 'runs_played', 1, null);
  await dailiesRepo.advanceDailyProgress(client, playerId, 'cubes_earned', event.rewardAmount, null);
  await dailiesRepo.advanceDailyProgress(client, playerId, 'distance_per_run', 1, event.serverDistance);
  await dailiesRepo.advanceDailyProgress(client, playerId, 'best_score', 1, event.serverScore);

  await dailiesRepo.recordDailyActivity(client, playerId);
}
