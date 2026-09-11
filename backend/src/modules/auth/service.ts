import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { ApiError } from '../../middleware/errorHandler';
import { signPlayerToken } from '../../lib/jwt';
import { PlayerRow } from '../../db/types';
import * as repo from './repository';

const BCRYPT_ROUNDS = 10;

export async function bootstrapGuest(pool: Pool): Promise<{ token: string; player: PlayerRow }> {
  const player = await repo.createGuestPlayer(pool);
  return { token: signPlayerToken(player.id), player };
}

export async function claimAccount(
  pool: Pool,
  playerId: string,
  params: { username: string; password: string; email?: string },
): Promise<{ token: string; player: PlayerRow }> {
  const player = await repo.findPlayerById(pool, playerId);
  if (!player) {
    throw new ApiError(404, 'player_not_found', 'Player not found');
  }
  if (!player.is_guest) {
    throw new ApiError(409, 'already_claimed', 'Account is already registered');
  }

  const existing = await repo.findPlayerByUsername(pool, params.username);
  if (existing) {
    throw new ApiError(409, 'username_taken', 'Username is already taken');
  }

  const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
  const claimed = await repo.claimPlayer(pool, playerId, {
    username: params.username,
    passwordHash,
    email: params.email ?? null,
  });

  return { token: signPlayerToken(claimed.id), player: claimed };
}

export async function login(
  pool: Pool,
  params: { username: string; password: string },
): Promise<{ token: string; player: PlayerRow }> {
  const player = await repo.findPlayerByUsername(pool, params.username);
  if (!player || !player.password_hash) {
    throw new ApiError(401, 'invalid_credentials', 'Invalid username or password');
  }

  const valid = await bcrypt.compare(params.password, player.password_hash);
  if (!valid) {
    throw new ApiError(401, 'invalid_credentials', 'Invalid username or password');
  }

  return { token: signPlayerToken(player.id), player };
}
