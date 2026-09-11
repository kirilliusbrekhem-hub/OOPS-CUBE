import { Migration } from '../migrate';

const migration: Migration = {
  id: '0002_currency_ledger',
  sql: `
    CREATE TABLE currency_ledger (
      id BIGSERIAL PRIMARY KEY,
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      amount BIGINT NOT NULL,
      reason TEXT NOT NULL CHECK (reason IN (
        'game_reward', 'quest_reward', 'daily_reward', 'topup', 'admin_adjustment'
      )),
      reference_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX currency_ledger_player_id_idx ON currency_ledger (player_id, created_at DESC);
  `,
};

export default migration;
