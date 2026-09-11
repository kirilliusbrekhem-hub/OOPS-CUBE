import { Migration } from '../migrate';
import m0001 from './0001_players';
import m0002 from './0002_currency_ledger';
import m0003 from './0003_players_guest_number';

export const migrations: Migration[] = [m0001, m0002, m0003];
