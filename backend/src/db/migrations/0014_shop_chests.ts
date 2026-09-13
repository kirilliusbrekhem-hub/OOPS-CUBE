import { Migration } from '../migrate';

const migration: Migration = {
  id: '0014_shop_chests',
  sql: `
    -- Chests are static reward-table definitions (see src/modules/shop/chests.ts),
    -- not DB rows — only the ledger reasons need to exist here.
    ALTER TABLE currency_ledger DROP CONSTRAINT currency_ledger_reason_check;
    ALTER TABLE currency_ledger ADD CONSTRAINT currency_ledger_reason_check CHECK (reason IN (
      'game_reward', 'quest_reward', 'daily_reward', 'topup', 'admin_adjustment',
      'skin_purchase', 'chest_purchase', 'chest_reward'
    ));

    INSERT INTO cube_skins (code, name, price_cubes, top_color, left_color, right_color) VALUES
      ('sunset', 'Sunset Drift', 3000, '#ffe4b5', '#c2410c', '#fb7185'),
      ('mint', 'Mint Circuit', 3000, '#d1fae5', '#059669', '#6ee7b7'),
      ('gold', 'Gold Rush', 7000, '#fef3c7', '#92400e', '#fbbf24'),
      ('nebula', 'Nebula', 8000, '#f5d0fe', '#6b21a8', '#d946ef');
  `,
};

export default migration;
