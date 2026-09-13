import { Pool } from 'pg';
import { ApiError } from '../../middleware/errorHandler';
import { creditCubes } from '../wallet/ledger';
import { serializePlayer } from '../players/serialize';
import * as skinsRepo from '../skins/repository';
import { CHESTS, findChest, rollCubesInRange, rollRewardTier } from './chests';

export interface ChestOddsDTO {
  type: 'cubes' | 'skin';
  oddsPercent: number;
  minCubes?: number;
  maxCubes?: number;
}

export interface ChestDTO {
  code: string;
  name: string;
  priceCubes: number;
  odds: ChestOddsDTO[];
}

export interface ChestOpenResultDTO {
  rewardType: 'cubes' | 'skin';
  cubesAmount?: number;
  skin?: { id: string; code: string; name: string; topColor: string; leftColor: string; rightColor: string };
  player: ReturnType<typeof serializePlayer>;
}

export function listChests(): ChestDTO[] {
  return CHESTS.map((chest) => {
    const total = chest.rewards.reduce((sum, r) => sum + r.weight, 0);
    return {
      code: chest.code,
      name: chest.name,
      priceCubes: chest.priceCubes,
      odds: chest.rewards.map((tier) => ({
        type: tier.type,
        oddsPercent: Math.round((tier.weight / total) * 1000) / 10,
        minCubes: tier.minCubes,
        maxCubes: tier.maxCubes,
      })),
    };
  });
}

export async function openChest(pool: Pool, playerId: string, code: string): Promise<ChestOpenResultDTO> {
  const chest = findChest(code);
  if (!chest) {
    throw new ApiError(404, 'chest_not_found', 'Unknown chest');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let player = await creditCubes(client, playerId, -chest.priceCubes, 'chest_purchase', chest.code);

    const tier = rollRewardTier(chest);
    let rewardType: 'cubes' | 'skin' = tier.type;
    let cubesAmount: number | undefined;
    let skinDto: ChestOpenResultDTO['skin'];

    if (tier.type === 'skin') {
      const [allSkins, ownedIds] = await Promise.all([
        skinsRepo.listActiveSkins(client),
        skinsRepo.listOwnedSkinIds(client, playerId),
      ]);
      const candidates = allSkins.filter((s) => s.price_cubes > 0 && !ownedIds.has(s.id));
      if (candidates.length === 0) {
        rewardType = 'cubes';
        cubesAmount = chest.fallbackCubes;
        player = await creditCubes(client, playerId, cubesAmount, 'chest_reward', chest.code);
      } else {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        await skinsRepo.grantSkin(client, playerId, chosen.id);
        skinDto = {
          id: chosen.id,
          code: chosen.code,
          name: chosen.name,
          topColor: chosen.top_color,
          leftColor: chosen.left_color,
          rightColor: chosen.right_color,
        };
      }
    } else {
      cubesAmount = rollCubesInRange(tier);
      player = await creditCubes(client, playerId, cubesAmount, 'chest_reward', chest.code);
    }

    await client.query('COMMIT');
    return { rewardType, cubesAmount, skin: skinDto, player: serializePlayer(player) };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof Error && 'code' in err && (err as { code?: string }).code === '23514') {
      throw new ApiError(400, 'insufficient_balance', 'Not enough CUBES for this chest');
    }
    throw err;
  } finally {
    client.release();
  }
}
