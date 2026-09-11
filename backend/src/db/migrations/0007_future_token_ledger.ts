import { Migration } from '../migrate';

const migration: Migration = {
  id: '0007_future_token_ledger',
  sql: `
    -- Accrual-only bookkeeping for a possible future on-chain token. No
    -- blockchain interaction happens here: this just records how much a
    -- player has earned that *could* be converted later.
    CREATE TABLE future_token_ledger (
      id BIGSERIAL PRIMARY KEY,
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      reference_id TEXT,
      accrued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      converted BOOLEAN NOT NULL DEFAULT false
    );

    CREATE INDEX future_token_ledger_player_id_idx ON future_token_ledger (player_id, accrued_at DESC);
  `,
};

export default migration;
