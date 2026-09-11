import { Pool } from 'pg';
import { ApiError } from '../../middleware/errorHandler';
import { creditCubes, creditFutureToken } from '../wallet/ledger';
import * as leaderboardRepo from '../leaderboard/repository';
import { serializePlayer } from '../players/serialize';
import * as repo from './repository';

export interface QuestDTO {
  id: string;
  code: string;
  title: string;
  metric: string;
  target: number;
  rewardAmount: number;
  paysIn: 'cubes' | 'future_token';
  progress: number;
  completed: boolean;
  claimed: boolean;
  currentRank: number | null;
}

export async function listQuests(pool: Pool, playerId: string): Promise<QuestDTO[]> {
  const [quests, progressRows] = await Promise.all([
    repo.listActiveQuests(pool),
    repo.getProgressForPlayer(pool, playerId),
  ]);
  const progressByQuestId = new Map(progressRows.map((row) => [row.quest_id, row]));

  const results: QuestDTO[] = [];
  for (const quest of quests) {
    const progress = progressByQuestId.get(quest.id);
    let currentRank: number | null = null;
    let completed = Boolean(progress?.completed_at);

    if (quest.metric === 'leaderboard_rank') {
      const ranked = await leaderboardRepo.getPlayerRank(pool, playerId);
      currentRank = ranked ? Number(ranked.rank) : null;
      completed = completed || (currentRank !== null && quest.threshold !== null && currentRank <= quest.threshold);
    }

    results.push({
      id: quest.id,
      code: quest.code,
      title: quest.title,
      metric: quest.metric,
      target: quest.target,
      rewardAmount: quest.reward_amount,
      paysIn: quest.pays_in,
      progress: progress?.progress ?? 0,
      completed,
      claimed: Boolean(progress?.claimed_at),
      currentRank,
    });
  }
  return results;
}

export async function claimQuest(pool: Pool, playerId: string, questId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const quest = await repo.getQuestById(client, questId);
    if (!quest || !quest.active) {
      throw new ApiError(404, 'quest_not_found', 'Quest not found');
    }

    let progress = await repo.lockProgress(client, playerId, questId);
    if (progress?.claimed_at) {
      throw new ApiError(409, 'already_claimed', 'Quest reward was already claimed');
    }

    if (quest.metric === 'leaderboard_rank') {
      const ranked = await leaderboardRepo.getPlayerRank(client, playerId);
      const rank = ranked ? Number(ranked.rank) : null;
      if (rank === null || quest.threshold === null || rank > quest.threshold) {
        throw new ApiError(400, 'not_eligible', 'Quest condition is not met yet');
      }
      progress = await repo.markLeaderboardQuestClaimed(client, playerId, questId, quest.target);
    } else {
      if (!progress?.completed_at) {
        throw new ApiError(400, 'not_eligible', 'Quest condition is not met yet');
      }
      progress = await repo.markClaimed(client, playerId, questId);
    }

    let player;
    if (quest.pays_in === 'cubes') {
      player = await creditCubes(client, playerId, quest.reward_amount, 'quest_reward', questId);
    } else {
      await creditFutureToken(client, playerId, quest.reward_amount, 'quest', questId);
      const { rows } = await client.query('SELECT * FROM players WHERE id = $1', [playerId]);
      player = rows[0];
    }

    await client.query('COMMIT');
    return { quest, progress, player: serializePlayer(player) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
