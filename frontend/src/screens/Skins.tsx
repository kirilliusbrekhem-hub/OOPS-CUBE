import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { CubeSkinDTO } from '../api/types';
import BottomNav from '../components/BottomNav';
import CubeIcon from '../components/CubeIcon';
import MobileScreen from '../components/MobileScreen';
import { useAuth } from '../state/AuthContext';

export default function Skins() {
  const { player, refresh } = useAuth();
  const [skins, setSkins] = useState<CubeSkinDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.skins();
    setSkins(res.skins);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buy = useCallback(
    async (skin: CubeSkinDTO) => {
      setError(null);
      setBusyId(skin.id);
      try {
        await api.purchaseSkin(skin.id);
        await Promise.all([load(), refresh()]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something went wrong');
      } finally {
        setBusyId(null);
      }
    },
    [load, refresh],
  );

  const equip = useCallback(
    async (skin: CubeSkinDTO) => {
      setError(null);
      setBusyId(skin.id);
      try {
        await api.equipSkin(skin.id);
        await refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something went wrong');
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  if (!player) return null;

  return (
    <MobileScreen>
      <div style={{ padding: '22px 20px 0' }}>
        <h3 style={{ margin: '0 0 3px', font: "500 25px/1 'Inter',sans-serif", letterSpacing: '-.02em', color: '#e9e9ed' }}>Cube skins</h3>
        <div style={{ font: "400 12px/1 'Inter',sans-serif", color: '#75798c' }}>Cosmetic only — buy with CUBES you already earned</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, font: "400 12px/1 'Inter',sans-serif", color: '#75798c' }}>
          Balance
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: "600 13px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>
            <CubeIcon size={11} />
            {player.balance.toLocaleString('en-US')}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ margin: '14px 20px 0', padding: '10px 13px', borderRadius: 10, background: 'rgba(240,160,160,.1)', boxShadow: 'inset 0 0 0 1px #f0a0a0', font: "400 12px/1.3 'Inter',sans-serif", color: '#f0a0a0' }}>
          {error}
        </div>
      )}

      <div style={{ padding: '20px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {skins.map((skin) => {
          const equipped = player.equippedSkinId === skin.id || (player.equippedSkinId === null && skin.code === 'classic');
          return (
            <div
              key={skin.id}
              style={{
                padding: '18px 14px 14px',
                borderRadius: 16,
                background: 'var(--color-surface)',
                boxShadow: equipped ? 'inset 0 0 0 1.5px #b5abfc, 0 0 22px rgba(145,132,217,.3)' : '0 0 0 1px #3f424d',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: `radial-gradient(circle, ${skin.topColor}55, transparent 70%)` }} />
                <CubeIcon size={44} topColor={skin.topColor} leftColor={skin.leftColor} rightColor={skin.rightColor} style={{ position: 'relative' }} />
              </div>
              <div style={{ font: "500 13px/1.2 'Inter',sans-serif", color: '#e9e9ed', textAlign: 'center' }}>{skin.name}</div>

              {equipped ? (
                <span style={{ font: "500 11px/1 'Inter',sans-serif", color: '#9184d9' }}>Equipped</span>
              ) : skin.owned ? (
                <button
                  onClick={() => equip(skin)}
                  disabled={busyId === skin.id}
                  style={{ width: '100%', height: 34, borderRadius: 10, border: 'none', boxShadow: 'inset 0 0 0 1px #595d6c', background: 'transparent', color: '#cfd3e5', font: "500 12px/1 'Inter',sans-serif", cursor: 'pointer' }}
                >
                  Equip
                </button>
              ) : (
                <button
                  onClick={() => buy(skin)}
                  disabled={busyId === skin.id}
                  style={{
                    width: '100%',
                    height: 34,
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(181,171,252,.12)',
                    boxShadow: 'inset 0 0 0 1px #b5abfc',
                    color: '#e7e5fe',
                    font: "600 12px/1 'Inter',sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <CubeIcon size={10} />
                  {skin.priceCubes.toLocaleString('en-US')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Link to="/profile" style={{ font: "500 12px/1 'Inter',sans-serif", color: '#9184d9', textDecoration: 'none' }}>
          ← Back to profile
        </Link>
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav />
    </MobileScreen>
  );
}
