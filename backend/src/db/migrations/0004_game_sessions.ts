import { Migration } from '../migrate';

const migration: Migration = {
  id: '0004_game_sessions',
  sql: `
    CREATE TABLE game_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
      server_score INTEGER NOT NULL DEFAULT 0,
      server_distance INTEGER NOT NULL DEFAULT 0,
      reward_amount INTEGER NOT NULL DEFAULT 0,
      idempotency_key TEXT UNIQUE,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_checkpoint_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ
    );

    CREATE INDEX game_sessions_player_id_idx ON game_sessions (player_id, started_at DESC);
  `,
};

export default migration;
