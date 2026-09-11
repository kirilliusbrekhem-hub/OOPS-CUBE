import { Migration } from '../migrate';

const migration: Migration = {
  id: '0009_topup_orders',
  sql: `
    -- No real payment provider is wired up yet. Orders are created as
    -- 'pending' and stay there until a future Stripe integration (or an
    -- admin, for manual testing) marks them completed. See
    -- src/modules/topup/router.ts for the stubbed webhook endpoint.
    CREATE TABLE topup_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      package_code TEXT NOT NULL,
      cubes_amount INTEGER NOT NULL,
      price_amount INTEGER NOT NULL,
      price_currency TEXT NOT NULL CHECK (price_currency IN ('RUB', 'USD')),
      provider TEXT NOT NULL DEFAULT 'stub' CHECK (provider IN ('stub')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at TIMESTAMPTZ
    );

    CREATE INDEX topup_orders_player_id_idx ON topup_orders (player_id, created_at DESC);
  `,
};

export default migration;
