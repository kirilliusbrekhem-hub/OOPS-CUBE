import { PlayerRow } from '../../db/types';

export interface PlayerDTO {
  id: string;
  isGuest: boolean;
  username: string | null;
  displayName: string;
  balance: number;
  bestScore: number;
  bestDistance: number;
  runsCount: number;
  createdAt: string;
}

export function serializePlayer(row: PlayerRow): PlayerDTO {
  return {
    id: row.id,
    isGuest: row.is_guest,
    username: row.username,
    displayName: row.display_name,
    balance: Number(row.balance),
    bestScore: row.best_score,
    bestDistance: row.best_distance,
    runsCount: row.runs_count,
    createdAt: row.created_at.toISOString(),
  };
}
