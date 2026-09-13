export interface ChestRewardTier {
  type: 'cubes' | 'skin';
  weight: number;
  minCubes?: number;
  maxCubes?: number;
}

export interface ChestDefinition {
  code: string;
  name: string;
  priceCubes: number;
  /** Used only if a 'skin' tier rolls and the player already owns every skin. */
  fallbackCubes: number;
  rewards: ChestRewardTier[];
}

// Static for MVP, same pattern as topup/packages.ts — no admin CRUD yet.
export const CHESTS: ChestDefinition[] = [
  {
    code: 'small',
    name: 'Small Cache',
    priceCubes: 500,
    fallbackCubes: 1200,
    rewards: [
      { type: 'cubes', weight: 70, minCubes: 200, maxCubes: 700 },
      { type: 'cubes', weight: 25, minCubes: 700, maxCubes: 1500 },
      { type: 'skin', weight: 5 },
    ],
  },
  {
    code: 'big',
    name: 'Big Vault',
    priceCubes: 2000,
    fallbackCubes: 4500,
    rewards: [
      { type: 'cubes', weight: 55, minCubes: 1000, maxCubes: 2500 },
      { type: 'cubes', weight: 30, minCubes: 2500, maxCubes: 5000 },
      { type: 'skin', weight: 15 },
    ],
  },
  {
    code: 'legendary',
    name: 'Legendary Chest',
    priceCubes: 5000,
    fallbackCubes: 10000,
    rewards: [
      { type: 'cubes', weight: 40, minCubes: 3000, maxCubes: 6000 },
      { type: 'cubes', weight: 25, minCubes: 6000, maxCubes: 12000 },
      { type: 'skin', weight: 35 },
    ],
  },
];

export function findChest(code: string): ChestDefinition | undefined {
  return CHESTS.find((c) => c.code === code);
}

export function rollRewardTier(chest: ChestDefinition): ChestRewardTier {
  const total = chest.rewards.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * total;
  for (const tier of chest.rewards) {
    if (roll < tier.weight) return tier;
    roll -= tier.weight;
  }
  return chest.rewards[chest.rewards.length - 1];
}

export function rollCubesInRange(tier: ChestRewardTier): number {
  const min = tier.minCubes ?? 0;
  const max = tier.maxCubes ?? min;
  return Math.round(min + Math.random() * (max - min));
}
