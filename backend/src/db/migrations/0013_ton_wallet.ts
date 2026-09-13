import { Migration } from '../migrate';

const migration: Migration = {
  id: '0013_ton_wallet',
  sql: `
    -- The connected wallet address is public info the player's own wallet
    -- app supplies via TonConnect (the player signs with their own key,
    -- which never reaches this server). No private keys or seed phrases
    -- are stored anywhere in this schema.
    ALTER TABLE players ADD COLUMN ton_wallet_address TEXT;

    -- Real on-chain sending requires a funded, key-holding hot wallet,
    -- which this app intentionally does not have (see README). A payout
    -- request just records "this player is owed this much, send it to
    -- this address" for the project owner to fulfill manually from their
    -- own wallet, then mark paid.
    CREATE TABLE token_payout_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      ton_wallet_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
      requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      paid_at TIMESTAMPTZ
    );

    CREATE INDEX token_payout_requests_status_idx ON token_payout_requests (status, requested_at);
  `,
};

export default migration;
