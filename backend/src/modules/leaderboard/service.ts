import type Redis from 'ioredis';
import { Pool } from 'pg';
import * as repo from './repository';

const CACHE_TTL_SECONDS = 5;

export interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  bestScore: number;
  isGuest: boolean;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  totalPlayers: number;
}

export async function getGlobalLeaderboard(
  pool: Pool,
  redis: Redis,
  limit: number,
  offset: number,
): Promise<LeaderboardPage> {
  const cacheKey = `leaderboard:global:${limit}:${offset}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as LeaderboardPage;
  }

  const [rows, totalPlayers] = await Promise.all([
    repo.getTopPlayers(pool, limit, offset),
    getTotalPlayers(pool, redis),
  ]);

  const entries: LeaderboardEntry[] = rows.map((row, index) => ({
    rank: offset + index + 1,
    id: row.id,
    displayName: row.display_name,
    bestScore: row.best_score,
    isGuest: row.is_guest,
  }));

  const page: LeaderboardPage = { entries, totalPlayers };
  await redis.set(cacheKey, JSON.stringify(page), 'EX', CACHE_TTL_SECONDS);
  return page;
}

async function getTotalPlayers(pool: Pool, redis: Redis): Promise<number> {
  const cacheKey = 'leaderboard:total-players';
  const cached = await redis.get(cacheKey);
  if (cached) return Number(cached);

  const total = await repo.countPlayers(pool);
  await redis.set(cacheKey, String(total), 'EX', CACHE_TTL_SECONDS);
  return total;
}

export interface MyRank {
  rank: number;
  displayName: string;
  bestScore: number;
}

export async function getMyRank(pool: Pool, playerId: string): Promise<MyRank | null> {
  const row = await repo.getPlayerRank(pool, playerId);
  if (!row) return null;
  return { rank: Number(row.rank), displayName: row.display_name, bestScore: row.best_score };
}
