export interface TopupPackage {
  code: string;
  label: string;
  cubesAmount: number;
  bonusPercent: number;
  priceRub: number;
  priceUsd: number;
  featured: boolean;
}

// Static for MVP — no admin CRUD for packages yet, matches the mockup's
// four tiers (project/OOPS CUBE.dc.html, screen 2f).
export const TOPUP_PACKAGES: TopupPackage[] = [
  { code: 'starter', label: 'Starter chip', cubesAmount: 5000, bonusPercent: 0, priceRub: 199, priceUsd: 2.49, featured: false },
  { code: 'best_value', label: 'Whale cube', cubesAmount: 36000, bonusPercent: 20, priceRub: 899, priceUsd: 9.99, featured: true },
  { code: 'big_stack', label: 'Big stack', cubesAmount: 15400, bonusPercent: 10, priceRub: 449, priceUsd: 4.99, featured: false },
  { code: 'absolute_unit', label: 'Absolute unit', cubesAmount: 135000, bonusPercent: 35, priceRub: 2590, priceUsd: 27.99, featured: false },
];

export function findPackage(code: string): TopupPackage | undefined {
  return TOPUP_PACKAGES.find((p) => p.code === code);
}

/** Price in the smallest currency unit (kopecks/cents) — avoids float storage. */
export function priceInMinorUnits(pkg: TopupPackage, currency: 'RUB' | 'USD'): number {
  return Math.round((currency === 'RUB' ? pkg.priceRub : pkg.priceUsd) * 100);
}
