import { Migration } from '../migrate';

const migration: Migration = {
  id: '0001_players',
  sql: `
    CREATE TABLE players (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      is_guest BOOLEAN NOT NULL DEFAULT true,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      display_name TEXT NOT NULL,
      balance BIGINT NOT NULL DEFAULT 0,
      best_score INTEGER NOT NULL DEFAULT 0,
      best_distance INTEGER NOT NULL DEFAULT 0,
      runs_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT players_balance_non_negative CHECK (balance >= 0)
    );

    CREATE INDEX players_best_score_idx ON players (best_score DESC);
  `,
};

export default migration;
