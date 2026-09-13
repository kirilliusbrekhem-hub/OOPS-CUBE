import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { CubeSkinDTO } from '../api/types';
import { useAuth } from '../state/AuthContext';

const CLASSIC_FALLBACK: CubeSkinDTO = {
  id: 'classic-fallback',
  code: 'classic',
  name: 'Classic',
  priceCubes: 0,
  topColor: '#b5abfc',
  leftColor: '#5d5294',
  rightColor: '#9184d9',
  owned: true,
};

/** The player's equipped cube skin, with a classic fallback while loading or if unset. */
export function useEquippedSkin(): CubeSkinDTO {
  const { player } = useAuth();
  const [skins, setSkins] = useState<CubeSkinDTO[]>([]);

  useEffect(() => {
    api.skins().then((res) => setSkins(res.skins));
  }, []);

  return skins.find((s) => s.id === player?.equippedSkinId) ?? skins.find((s) => s.code === 'classic') ?? CLASSIC_FALLBACK;
}
