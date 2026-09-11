import { Migration } from '../migrate';

const migration: Migration = {
  id: '0006_daily_tasks',
  sql: `
    CREATE TABLE daily_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      metric TEXT NOT NULL CHECK (metric IN (
        'runs_played', 'cubes_earned', 'distance_per_run', 'best_score'
      )),
      threshold INTEGER,
      target INTEGER NOT NULL,
      reward_amount INTEGER NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE player_daily_progress (
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      daily_task_id UUID NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
      day DATE NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ,
      claimed_at TIMESTAMPTZ,
      PRIMARY KEY (player_id, daily_task_id, day)
    );

    CREATE TABLE player_streaks (
      player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      current_streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      last_completed_date DATE
    );
  `,
};

export default migration;
