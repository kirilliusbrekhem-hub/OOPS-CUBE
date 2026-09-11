import { Migration } from '../migrate';
import m0001 from './0001_players';
import m0002 from './0002_currency_ledger';

export const migrations: Migration[] = [m0001, m0002];
