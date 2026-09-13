import { Pool } from 'pg';
import { ApiError } from '../../middleware/errorHandler';
import { creditCubes } from '../wallet/ledger';
import { serializePlayer } from '../players/serialize';
import * as repo from './repository';

export interface SkinDTO {
  id: string;
  code: string;
  name: string;
  priceCubes: number;
  topColor: string;
  leftColor: string;
  rightColor: string;
  owned: boolean;
}

export async function listSkins(pool: Pool, playerId: string): Promise<SkinDTO[]> {
  const [skins, ownedIds] = await Promise.all([repo.listActiveSkins(pool), repo.listOwnedSkinIds(pool, playerId)]);
  return skins.map((skin) => ({
    id: skin.id,
    code: skin.code,
    name: skin.name,
    priceCubes: skin.price_cubes,
    topColor: skin.top_color,
    leftColor: skin.left_color,
    rightColor: skin.right_color,
    owned: skin.price_cubes === 0 || ownedIds.has(skin.id),
  }));
}

export async function purchaseSkin(pool: Pool, playerId: string, skinId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const skin = await repo.getSkinById(client, skinId);
    if (!skin || !skin.active) {
      throw new ApiError(404, 'skin_not_found', 'Skin not found');
    }
    if (skin.price_cubes === 0) {
      throw new ApiError(409, 'already_owned', 'This skin is free for everyone');
    }
    if (await repo.isSkinOwned(client, playerId, skinId)) {
      throw new ApiError(409, 'already_owned', 'Skin already owned');
    }

    const player = await creditCubes(client, playerId, -skin.price_cubes, 'skin_purchase', skinId);
    await repo.grantSkin(client, playerId, skinId);

    await client.query('COMMIT');
    return { skin, player: serializePlayer(player) };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof Error && 'code' in err && (err as { code?: string }).code === '23514') {
      throw new ApiError(400, 'insufficient_balance', 'Not enough CUBES for this skin');
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function equipSkin(pool: Pool, playerId: string, skinId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const skin = await repo.getSkinById(client, skinId);
    if (!skin || !skin.active) {
      throw new ApiError(404, 'skin_not_found', 'Skin not found');
    }
    const owned = skin.price_cubes === 0 || (await repo.isSkinOwned(client, playerId, skinId));
    if (!owned) {
      throw new ApiError(403, 'not_owned', 'You do not own this skin yet');
    }

    const player = await repo.equipSkinForPlayer(client, playerId, skinId);
    await client.query('COMMIT');
    return { player: serializePlayer(player) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
