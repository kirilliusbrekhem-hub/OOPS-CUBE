import { Pool, PoolClient } from 'pg';
import { CubeSkinRow } from '../../db/types';

export async function listActiveSkins(pool: Pool | PoolClient): Promise<CubeSkinRow[]> {
  const { rows } = await pool.query<CubeSkinRow>(
    'SELECT * FROM cube_skins WHERE active = true ORDER BY price_cubes',
  );
  return rows;
}

export async function getSkinById(pool: Pool | PoolClient, id: string): Promise<CubeSkinRow | null> {
  const { rows } = await pool.query<CubeSkinRow>('SELECT * FROM cube_skins WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function listOwnedSkinIds(pool: Pool | PoolClient, playerId: string): Promise<Set<string>> {
  const { rows } = await pool.query<{ skin_id: string }>(
    'SELECT skin_id FROM player_owned_skins WHERE player_id = $1',
    [playerId],
  );
  return new Set(rows.map((r) => r.skin_id));
}

export async function isSkinOwned(client: PoolClient, playerId: string, skinId: string): Promise<boolean> {
  const { rows } = await client.query(
    'SELECT 1 FROM player_owned_skins WHERE player_id = $1 AND skin_id = $2',
    [playerId, skinId],
  );
  return rows.length > 0;
}

export async function grantSkin(client: PoolClient, playerId: string, skinId: string): Promise<void> {
  await client.query(
    'INSERT INTO player_owned_skins (player_id, skin_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [playerId, skinId],
  );
}

export async function equipSkinForPlayer(client: PoolClient, playerId: string, skinId: string | null) {
  const { rows } = await client.query(
    'UPDATE players SET equipped_skin_id = $2 WHERE id = $1 RETURNING *',
    [playerId, skinId],
  );
  return rows[0];
}
