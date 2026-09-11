import { Pool, PoolClient } from 'pg';
import { TopupOrderRow } from '../../db/types';
import { priceInMinorUnits, TopupPackage } from './packages';

export async function createOrder(
  pool: Pool,
  playerId: string,
  pkg: TopupPackage,
  currency: 'RUB' | 'USD',
): Promise<TopupOrderRow> {
  const priceAmount = priceInMinorUnits(pkg, currency);
  const { rows } = await pool.query<TopupOrderRow>(
    `INSERT INTO topup_orders (player_id, package_code, cubes_amount, price_amount, price_currency)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [playerId, pkg.code, pkg.cubesAmount, priceAmount, currency],
  );
  return rows[0];
}

export async function listOrdersForPlayer(pool: Pool, playerId: string): Promise<TopupOrderRow[]> {
  const { rows } = await pool.query<TopupOrderRow>(
    'SELECT * FROM topup_orders WHERE player_id = $1 ORDER BY created_at DESC LIMIT 50',
    [playerId],
  );
  return rows;
}

export async function lockOrder(client: PoolClient, id: string): Promise<TopupOrderRow | null> {
  const { rows } = await client.query<TopupOrderRow>('SELECT * FROM topup_orders WHERE id = $1 FOR UPDATE', [id]);
  return rows[0] ?? null;
}

export async function markOrderCompleted(client: PoolClient, id: string): Promise<TopupOrderRow> {
  const { rows } = await client.query<TopupOrderRow>(
    `UPDATE topup_orders SET status = 'completed', completed_at = now() WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0];
}
