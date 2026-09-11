import { Migration } from '../migrate';
import m0001 from './0001_players';
import m0002 from './0002_currency_ledger';
import m0003 from './0003_players_guest_number';
import m0004 from './0004_game_sessions';

export const migrations: Migration[] = [m0001, m0002, m0003, m0004];
