import { Migration } from '../migrate';

const migration: Migration = {
  id: '0011_cube_skins',
  sql: `
    -- Cosmetic only: recolors of the same isometric cube mark. Any skin
    -- with price_cubes = 0 is implicitly owned by everyone (no ownership
    -- row needed) — see src/modules/skins/repository.ts.
    CREATE TABLE cube_skins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price_cubes INTEGER NOT NULL DEFAULT 0,
      top_color TEXT NOT NULL,
      left_color TEXT NOT NULL,
      right_color TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE player_owned_skins (
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      skin_id UUID NOT NULL REFERENCES cube_skins(id) ON DELETE CASCADE,
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (player_id, skin_id)
    );

    ALTER TABLE players ADD COLUMN equipped_skin_id UUID REFERENCES cube_skins(id);

    ALTER TABLE currency_ledger DROP CONSTRAINT currency_ledger_reason_check;
    ALTER TABLE currency_ledger ADD CONSTRAINT currency_ledger_reason_check CHECK (reason IN (
      'game_reward', 'quest_reward', 'daily_reward', 'topup', 'admin_adjustment', 'skin_purchase'
    ));
  `,
};

export default migration;
