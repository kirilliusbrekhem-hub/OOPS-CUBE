import { Migration } from '../migrate';
import m0001 from './0001_players';
import m0002 from './0002_currency_ledger';
import m0003 from './0003_players_guest_number';
import m0004 from './0004_game_sessions';
import m0005 from './0005_quests';
import m0006 from './0006_daily_tasks';
import m0007 from './0007_future_token_ledger';
import m0008 from './0008_seed_quests_and_dailies';
import m0009 from './0009_topup_orders';
import m0010 from './0010_admin_users';
import m0011 from './0011_cube_skins';
import m0012 from './0012_seed_cube_skins';

export const migrations: Migration[] = [
  m0001,
  m0002,
  m0003,
  m0004,
  m0005,
  m0006,
  m0007,
  m0008,
  m0009,
  m0010,
  m0011,
  m0012,
];
