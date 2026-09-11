import { TopupOrderRow } from '../../db/types';

export interface TopupOrderDTO {
  id: string;
  packageCode: string;
  cubesAmount: number;
  /** Smallest currency unit — kopecks for RUB, cents for USD. */
  priceAmount: number;
  priceCurrency: 'RUB' | 'USD';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
}

export function serializeOrder(row: TopupOrderRow): TopupOrderDTO {
  return {
    id: row.id,
    packageCode: row.package_code,
    cubesAmount: row.cubes_amount,
    priceAmount: row.price_amount,
    priceCurrency: row.price_currency,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  };
}
