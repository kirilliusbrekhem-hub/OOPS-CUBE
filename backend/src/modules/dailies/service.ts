import { Pool } from 'pg';
import { ApiError } from '../../middleware/errorHandler';
import { creditCubes } from '../wallet/ledger';
import { serializePlayer } from '../players/serialize';
import * as repo from './repository';

export interface DailyTaskDTO {
  id: string;
  code: string;
  title: string;
  metric: string;
  target: number;
  rewardAmount: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface StreakDTO {
  currentStreak: number;
  bestStreak: number;
  bonusMultiplier: number;
}

export async function listDailies(pool: Pool, playerId: string): Promise<{ tasks: DailyTaskDTO[]; streak: StreakDTO }> {
  const [tasks, progressRows, streakRow] = await Promise.all([
    repo.listActiveDailyTasks(pool),
    repo.getTodayProgressForPlayer(pool, playerId),
    repo.getStreak(pool, playerId),
  ]);
  const progressByTaskId = new Map(progressRows.map((row) => [row.daily_task_id, row]));

  const dtos: DailyTaskDTO[] = tasks.map((task) => {
    const progress = progressByTaskId.get(task.id);
    return {
      id: task.id,
      code: task.code,
      title: task.title,
      metric: task.metric,
      target: task.target,
      rewardAmount: task.reward_amount,
      progress: progress?.progress ?? 0,
      completed: Boolean(progress?.completed_at),
      claimed: Boolean(progress?.claimed_at),
    };
  });

  const currentStreak = streakRow?.current_streak ?? 0;
  return {
    tasks: dtos,
    streak: {
      currentStreak,
      bestStreak: streakRow?.best_streak ?? 0,
      // Display-only for now: not yet applied to actual reward crediting.
      bonusMultiplier: Math.min(1 + currentStreak * 0.1, 2),
    },
  };
}

export async function claimDailyTask(pool: Pool, playerId: string, dailyTaskId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const task = await repo.getDailyTaskById(client, dailyTaskId);
    if (!task || !task.active) {
      throw new ApiError(404, 'daily_task_not_found', 'Daily task not found');
    }

    const progress = await repo.lockTodayProgress(client, playerId, dailyTaskId);
    if (progress?.claimed_at) {
      throw new ApiError(409, 'already_claimed', 'Daily task reward was already claimed');
    }
    if (!progress?.completed_at) {
      throw new ApiError(400, 'not_eligible', 'Daily task condition is not met yet');
    }

    const claimed = await repo.markTodayClaimed(client, playerId, dailyTaskId);
    const player = await creditCubes(client, playerId, task.reward_amount, 'daily_reward', dailyTaskId);

    await client.query('COMMIT');
    return { task, progress: claimed, player: serializePlayer(player) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
