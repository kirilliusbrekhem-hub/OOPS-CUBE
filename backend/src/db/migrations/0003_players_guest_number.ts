import { Migration } from '../migrate';

const migration: Migration = {
  id: '0003_players_guest_number',
  sql: `
    ALTER TABLE players ADD COLUMN guest_number BIGSERIAL UNIQUE;
  `,
};

export default migration;
