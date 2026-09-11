import { Pool, PoolClient } from 'pg';
import { DailyTaskRow, ObjectiveMetric, PlayerDailyProgressRow, PlayerStreakRow } from '../../db/types';

export async function listActiveDailyTasks(pool: Pool | PoolClient): Promise<DailyTaskRow[]> {
  const { rows } = await pool.query<DailyTaskRow>('SELECT * FROM daily_tasks WHERE active = true ORDER BY created_at');
  return rows;
}

export async function getDailyTaskById(pool: Pool | PoolClient, id: string): Promise<DailyTaskRow | null> {
  const { rows } = await pool.query<DailyTaskRow>('SELECT * FROM daily_tasks WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function getTodayProgressForPlayer(
  pool: Pool | PoolClient,
  playerId: string,
): Promise<PlayerDailyProgressRow[]> {
  const { rows } = await pool.query<PlayerDailyProgressRow>(
    'SELECT * FROM player_daily_progress WHERE player_id = $1 AND day = CURRENT_DATE',
    [playerId],
  );
  return rows;
}

export async function lockTodayProgress(
  client: PoolClient,
  playerId: string,
  dailyTaskId: string,
): Promise<PlayerDailyProgressRow | null> {
  const { rows } = await client.query<PlayerDailyProgressRow>(
    'SELECT * FROM player_daily_progress WHERE player_id = $1 AND daily_task_id = $2 AND day = CURRENT_DATE FOR UPDATE',
    [playerId, dailyTaskId],
  );
  return rows[0] ?? null;
}

function computeIncrement(
  metric: ObjectiveMetric,
  threshold: number | null,
  cumulativeAmount: number,
  eventValue: number | null,
): number {
  switch (metric) {
    case 'runs_played':
    case 'cubes_earned':
      return cumulativeAmount;
    case 'distance_per_run':
    case 'best_score':
      return eventValue !== null && threshold !== null && eventValue >= threshold ? 1 : 0;
    default:
      return 0;
  }
}

export async function advanceDailyProgress(
  client: PoolClient,
  playerId: string,
  metric: ObjectiveMetric,
  cumulativeAmount: number,
  eventValue: number | null,
): Promise<void> {
  const { rows: tasks } = await client.query<DailyTaskRow>(
    'SELECT * FROM daily_tasks WHERE active = true AND metric = $1',
    [metric],
  );

  for (const task of tasks) {
    const increment = computeIncrement(metric, task.threshold, cumulativeAmount, eventValue);
    if (increment <= 0) continue;

    await client.query(
      `INSERT INTO player_daily_progress (player_id, daily_task_id, day, progress, completed_at)
       VALUES ($1, $2, CURRENT_DATE, LEAST($4::integer, $3::integer), CASE WHEN LEAST($4::integer, $3::integer) >= $3::integer THEN now() ELSE NULL END)
       ON CONFLICT (player_id, daily_task_id, day) DO UPDATE SET
         progress = LEAST(player_daily_progress.progress + $4::integer, $3::integer),
         completed_at = CASE
           WHEN player_daily_progress.completed_at IS NOT NULL THEN player_daily_progress.completed_at
           WHEN LEAST(player_daily_progress.progress + $4::integer, $3::integer) >= $3::integer THEN now()
           ELSE NULL
         END`,
      [playerId, task.id, task.target, increment],
    );
  }
}

export async function markTodayClaimed(
  client: PoolClient,
  playerId: string,
  dailyTaskId: string,
): Promise<PlayerDailyProgressRow> {
  const { rows } = await client.query<PlayerDailyProgressRow>(
    `UPDATE player_daily_progress SET claimed_at = now()
     WHERE player_id = $1 AND daily_task_id = $2 AND day = CURRENT_DATE
     RETURNING *`,
    [playerId, dailyTaskId],
  );
  return rows[0];
}

export async function getStreak(pool: Pool | PoolClient, playerId: string): Promise<PlayerStreakRow | null> {
  const { rows } = await pool.query<PlayerStreakRow>('SELECT * FROM player_streaks WHERE player_id = $1', [
    playerId,
  ]);
  return rows[0] ?? null;
}

export async function recordDailyActivity(client: PoolClient, playerId: string): Promise<PlayerStreakRow> {
  const { rows } = await client.query<PlayerStreakRow>(
    `INSERT INTO player_streaks (player_id, current_streak, best_streak, last_completed_date)
     VALUES ($1, 1, 1, CURRENT_DATE)
     ON CONFLICT (player_id) DO UPDATE SET
       current_streak = CASE
         WHEN player_streaks.last_completed_date = CURRENT_DATE THEN player_streaks.current_streak
         WHEN player_streaks.last_completed_date = CURRENT_DATE - INTERVAL '1 day' THEN player_streaks.current_streak + 1
         ELSE 1
       END,
       best_streak = GREATEST(player_streaks.best_streak, CASE
         WHEN player_streaks.last_completed_date = CURRENT_DATE THEN player_streaks.current_streak
         WHEN player_streaks.last_completed_date = CURRENT_DATE - INTERVAL '1 day' THEN player_streaks.current_streak + 1
         ELSE 1
       END),
       last_completed_date = CURRENT_DATE
     RETURNING *`,
    [playerId],
  );
  return rows[0];
}
