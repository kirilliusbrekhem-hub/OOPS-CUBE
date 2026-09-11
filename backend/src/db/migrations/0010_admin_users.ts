import { Migration } from '../migrate';

const migration: Migration = {
  id: '0010_admin_users',
  sql: `
    CREATE TABLE admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
};

export default migration;
