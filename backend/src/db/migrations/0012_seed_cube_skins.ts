import { Migration } from '../migrate';

const migration: Migration = {
  id: '0012_seed_cube_skins',
  sql: `
    INSERT INTO cube_skins (code, name, price_cubes, top_color, left_color, right_color) VALUES
      ('classic', 'Classic', 0, '#b5abfc', '#5d5294', '#9184d9'),
      ('plasma', 'Plasma Surge', 2500, '#f5f4ff', '#7c3aed', '#a78bfa'),
      ('glacier', 'Glacier', 4000, '#e0f2fe', '#0891b2', '#67e8f9'),
      ('ember', 'Ember', 4000, '#fed7aa', '#c2410c', '#fb923c'),
      ('void', 'Void', 6000, '#4c1d95', '#0f0a2e', '#3730a3');
  `,
};

export default migration;
