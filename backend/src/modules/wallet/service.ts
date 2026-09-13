import { Pool } from 'pg';
import { ApiError } from '../../middleware/errorHandler';
import { isPlausibleTonAddress } from '../../lib/ton';
import { serializePlayer } from '../players/serialize';
import * as repo from './repository';

export async function connectTonWallet(pool: Pool, playerId: string, address: string) {
  if (!isPlausibleTonAddress(address)) {
    throw new ApiError(400, 'invalid_address', 'That does not look like a TON wallet address');
  }
  const player = await repo.setTonWalletAddress(pool, playerId, address);
  return { player: serializePlayer(player) };
}

/**
 * No automated on-chain sending happens here — see README. This just
 * reserves the player's currently-accrued (unconverted) future-token
 * balance against a payout request that the project owner fulfills
 * manually from their own wallet, then marks paid via the admin endpoint.
 */
export async function requestPayout(pool: Pool, playerId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: playerRows } = await client.query('SELECT ton_wallet_address FROM players WHERE id = $1 FOR UPDATE', [
      playerId,
    ]);
    const tonWalletAddress = playerRows[0]?.ton_wallet_address as string | null | undefined;
    if (!tonWalletAddress) {
      throw new ApiError(400, 'wallet_not_connected', 'Connect a TON wallet before requesting a payout');
    }

    const amount = await repo.getUnconvertedFutureTokenTotal(client, playerId);
    if (amount <= 0) {
      throw new ApiError(400, 'nothing_to_pay_out', 'No claimable OP$ balance yet');
    }

    await repo.markFutureTokenConverted(client, playerId);
    const request = await repo.createPayoutRequest(client, playerId, amount, tonWalletAddress);

    await client.query('COMMIT');
    return { request };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
