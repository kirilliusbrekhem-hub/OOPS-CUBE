import { Pool, PoolClient } from 'pg';
import { ObjectiveMetric, PlayerQuestProgressRow, QuestRow } from '../../db/types';

export async function listActiveQuests(pool: Pool | PoolClient): Promise<QuestRow[]> {
  const { rows } = await pool.query<QuestRow>('SELECT * FROM quests WHERE active = true ORDER BY created_at');
  return rows;
}

export async function listAllQuests(pool: Pool | PoolClient): Promise<QuestRow[]> {
  const { rows } = await pool.query<QuestRow>('SELECT * FROM quests ORDER BY created_at');
  return rows;
}

export interface CreateQuestInput {
  code: string;
  title: string;
  metric: ObjectiveMetric;
  threshold: number | null;
  target: number;
  rewardAmount: number;
  paysIn: 'cubes' | 'future_token';
}

export async function createQuest(pool: Pool | PoolClient, input: CreateQuestInput): Promise<QuestRow> {
  const { rows } = await pool.query<QuestRow>(
    `INSERT INTO quests (code, title, metric, threshold, target, reward_amount, pays_in)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [input.code, input.title, input.metric, input.threshold, input.target, input.rewardAmount, input.paysIn],
  );
  return rows[0];
}

export interface UpdateQuestInput {
  title?: string;
  rewardAmount?: number;
  active?: boolean;
}

export async function updateQuest(
  pool: Pool | PoolClient,
  id: string,
  input: UpdateQuestInput,
): Promise<QuestRow | null> {
  const { rows } = await pool.query<QuestRow>(
    `UPDATE quests SET
       title = COALESCE($2, title),
       reward_amount = COALESCE($3, reward_amount),
       active = COALESCE($4, active)
     WHERE id = $1
     RETURNING *`,
    [id, input.title ?? null, input.rewardAmount ?? null, input.active ?? null],
  );
  return rows[0] ?? null;
}

export async function getQuestById(pool: Pool | PoolClient, id: string): Promise<QuestRow | null> {
  const { rows } = await pool.query<QuestRow>('SELECT * FROM quests WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function getProgressForPlayer(
  pool: Pool | PoolClient,
  playerId: string,
): Promise<PlayerQuestProgressRow[]> {
  const { rows } = await pool.query<PlayerQuestProgressRow>(
    'SELECT * FROM player_quest_progress WHERE player_id = $1',
    [playerId],
  );
  return rows;
}

export async function lockProgress(
  client: PoolClient,
  playerId: string,
  questId: string,
): Promise<PlayerQuestProgressRow | null> {
  const { rows } = await client.query<PlayerQuestProgressRow>(
    'SELECT * FROM player_quest_progress WHERE player_id = $1 AND quest_id = $2 FOR UPDATE',
    [playerId, questId],
  );
  return rows[0] ?? null;
}

function computeIncrement(metric: ObjectiveMetric, threshold: number | null, cumulativeAmount: number, eventValue: number | null): number {
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

/**
 * Advances progress for every active quest matching `metric`. Called from
 * inside the game session's end transaction so progress and the reward
 * credit commit or roll back together.
 */
export async function advanceQuestProgress(
  client: PoolClient,
  playerId: string,
  metric: ObjectiveMetric,
  cumulativeAmount: number,
  eventValue: number | null,
): Promise<void> {
  const { rows: quests } = await client.query<QuestRow>(
    'SELECT * FROM quests WHERE active = true AND metric = $1',
    [metric],
  );

  for (const quest of quests) {
    const increment = computeIncrement(metric, quest.threshold, cumulativeAmount, eventValue);
    if (increment <= 0) continue;

    await client.query(
      `INSERT INTO player_quest_progress (player_id, quest_id, progress, completed_at)
       VALUES ($1, $2, LEAST($4::integer, $3::integer), CASE WHEN LEAST($4::integer, $3::integer) >= $3::integer THEN now() ELSE NULL END)
       ON CONFLICT (player_id, quest_id) DO UPDATE SET
         progress = LEAST(player_quest_progress.progress + $4::integer, $3::integer),
         completed_at = CASE
           WHEN player_quest_progress.completed_at IS NOT NULL THEN player_quest_progress.completed_at
           WHEN LEAST(player_quest_progress.progress + $4::integer, $3::integer) >= $3::integer THEN now()
           ELSE NULL
         END`,
      [playerId, quest.id, quest.target, increment],
    );
  }
}

export async function markLeaderboardQuestClaimed(
  client: PoolClient,
  playerId: string,
  questId: string,
  target: number,
): Promise<PlayerQuestProgressRow> {
  const { rows } = await client.query<PlayerQuestProgressRow>(
    `INSERT INTO player_quest_progress (player_id, quest_id, progress, completed_at, claimed_at)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (player_id, quest_id) DO UPDATE SET
       progress = $3, completed_at = COALESCE(player_quest_progress.completed_at, now()), claimed_at = now()
     RETURNING *`,
    [playerId, questId, target],
  );
  return rows[0];
}

export async function markClaimed(
  client: PoolClient,
  playerId: string,
  questId: string,
): Promise<PlayerQuestProgressRow> {
  const { rows } = await client.query<PlayerQuestProgressRow>(
    `UPDATE player_quest_progress SET claimed_at = now() WHERE player_id = $1 AND quest_id = $2 RETURNING *`,
    [playerId, questId],
  );
  return rows[0];
}
