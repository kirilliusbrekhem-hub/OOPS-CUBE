import { Migration } from '../migrate';

const migration: Migration = {
  id: '0005_quests',
  sql: `
    CREATE TABLE quests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      metric TEXT NOT NULL CHECK (metric IN (
        'runs_played', 'cubes_earned', 'distance_per_run', 'best_score', 'leaderboard_rank'
      )),
      threshold INTEGER,
      target INTEGER NOT NULL,
      reward_amount INTEGER NOT NULL,
      pays_in TEXT NOT NULL DEFAULT 'cubes' CHECK (pays_in IN ('cubes', 'future_token')),
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE player_quest_progress (
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      progress INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ,
      claimed_at TIMESTAMPTZ,
      PRIMARY KEY (player_id, quest_id)
    );
  `,
};

export default migration;
