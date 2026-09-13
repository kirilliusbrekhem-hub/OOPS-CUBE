import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ChestDTO, ChestOpenResult, CubeSkinDTO } from '../api/types';
import BottomNav from '../components/BottomNav';
import CubeIcon from '../components/CubeIcon';
import MobileScreen from '../components/MobileScreen';
import { useAuth } from '../state/AuthContext';

type Tab = 'skins' | 'chests';

function chestGlow(chest: ChestDTO): string {
  if (chest.code === 'legendary') return '#fbbf24';
  if (chest.code === 'big') return '#b5abfc';
  return '#75798c';
}

function formatOdds(odds: ChestDTO['odds'][number]): string {
  if (odds.type === 'skin') return `${odds.oddsPercent}% · random skin`;
  return `${odds.oddsPercent}% · ${odds.minCubes?.toLocaleString('en-US')}–${odds.maxCubes?.toLocaleString('en-US')} CUBES`;
}

export default function Shop() {
  const { player, refresh } = useAuth();
  const [tab, setTab] = useState<Tab>('skins');
  const [skins, setSkins] = useState<CubeSkinDTO[]>([]);
  const [chests, setChests] = useState<ChestDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ chestName: string; result: ChestOpenResult } | null>(null);

  const loadSkins = useCallback(async () => {
    const res = await api.skins();
    setSkins(res.skins);
  }, []);

  useEffect(() => {
    loadSkins();
    api.chests().then((res) => setChests(res.chests));
  }, [loadSkins]);

  const buySkin = useCallback(
    async (skin: CubeSkinDTO) => {
      setError(null);
      setBusyId(skin.id);
      try {
        await api.purchaseSkin(skin.id);
        await Promise.all([loadSkins(), refresh()]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something went wrong');
      } finally {
        setBusyId(null);
      }
    },
    [loadSkins, refresh],
  );

  const equipSkin = useCallback(
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

  const openChest = useCallback(
    async (chest: ChestDTO) => {
      setError(null);
      setBusyId(chest.code);
      try {
        const result = await api.openChest(chest.code);
        setReveal({ chestName: chest.name, result });
        await Promise.all([loadSkins(), refresh()]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something went wrong');
      } finally {
        setBusyId(null);
      }
    },
    [loadSkins, refresh],
  );

  if (!player) return null;

  return (
    <MobileScreen>
      <div style={{ padding: '22px 20px 0' }}>
        <h3 style={{ margin: '0 0 3px', font: "500 25px/1 'Inter',sans-serif", letterSpacing: '-.02em', color: '#e9e9ed' }}>Shop</h3>
        <div style={{ font: "400 12px/1 'Inter',sans-serif", color: '#75798c' }}>Spend CUBES you already earned — cosmetic only</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, font: "400 12px/1 'Inter',sans-serif", color: '#75798c' }}>
          Balance
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: "600 13px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>
            <CubeIcon size={11} />
            {player.balance.toLocaleString('en-US')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '18px 20px 0' }}>
        {(['skins', 'chests'] as Tab[]).map((t) => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px 0',
              textAlign: 'center',
              font: "500 13px/1 'Inter',sans-serif",
              color: tab === t ? '#d2cefd' : '#75798c',
              boxShadow: tab === t ? 'inset 0 -2px 0 #b5abfc' : 'inset 0 -1px 0 #3f424d',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ margin: '14px 20px 0', padding: '10px 13px', borderRadius: 10, background: 'rgba(240,160,160,.1)', boxShadow: 'inset 0 0 0 1px #f0a0a0', font: "400 12px/1.3 'Inter',sans-serif", color: '#f0a0a0' }}>
          {error}
        </div>
      )}

      {tab === 'skins' && (
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
                    onClick={() => equipSkin(skin)}
                    disabled={busyId === skin.id}
                    style={{ width: '100%', height: 34, borderRadius: 10, border: 'none', boxShadow: 'inset 0 0 0 1px #595d6c', background: 'transparent', color: '#cfd3e5', font: "500 12px/1 'Inter',sans-serif", cursor: 'pointer' }}
                  >
                    Equip
                  </button>
                ) : (
                  <button
                    onClick={() => buySkin(skin)}
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
      )}

      {tab === 'chests' && (
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chests.map((chest) => {
            const glow = chestGlow(chest);
            const canAfford = player.balance >= chest.priceCubes;
            return (
              <div
                key={chest.code}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: 'var(--color-surface)',
                  boxShadow: `0 0 0 1px ${glow}55`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      flex: 'none',
                      borderRadius: 13,
                      background: `${glow}1f`,
                      boxShadow: `inset 0 0 0 1px ${glow}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 21,
                      color: glow,
                    }}
                  >
                    <i className="ph-fill ph-package" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>{chest.name}</div>
                    <div style={{ font: "400 10px/1.4 'Inter',sans-serif", color: '#75798c' }}>
                      {chest.odds.map(formatOdds).join(' · ')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openChest(chest)}
                  disabled={busyId === chest.code || !canAfford}
                  style={{
                    height: 40,
                    borderRadius: 11,
                    border: 'none',
                    background: canAfford ? 'rgba(181,171,252,.12)' : 'transparent',
                    boxShadow: canAfford ? 'inset 0 0 0 1px #b5abfc' : 'inset 0 0 0 1px #3f424d',
                    color: canAfford ? '#e7e5fe' : '#595d6c',
                    font: "600 12px/1 'Inter',sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                  }}
                >
                  <CubeIcon size={11} />
                  {busyId === chest.code ? 'Opening…' : chest.priceCubes.toLocaleString('en-US')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <Link to="/profile" style={{ font: "500 12px/1 'Inter',sans-serif", color: '#9184d9', textDecoration: 'none' }}>
          ← Back to profile
        </Link>
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav />

      {reveal && (
        <div
          onClick={() => setReveal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10,11,20,.78)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 280,
              padding: '30px 24px 24px',
              borderRadius: 22,
              background: 'linear-gradient(165deg,#232538,#171926)',
              boxShadow: '0 0 0 1px #423a6a, 0 20px 60px rgba(0,0,0,.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              textAlign: 'center',
              animation: 'chestRevealPop .4s cubic-bezier(.2,0,.2,1.4)',
            }}
          >
            <div style={{ font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.18em', color: '#75798c' }}>{reveal.chestName.toUpperCase()}</div>

            {reveal.result.rewardType === 'skin' && reveal.result.skin ? (
              <>
                <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'chestRevealSpin .6s ease-out' }}>
                  <div style={{ position: 'absolute', inset: -18, borderRadius: '50%', background: `radial-gradient(circle, ${reveal.result.skin.topColor}66, transparent 70%)` }} />
                  <CubeIcon size={58} topColor={reveal.result.skin.topColor} leftColor={reveal.result.skin.leftColor} rightColor={reveal.result.skin.rightColor} style={{ position: 'relative' }} />
                </div>
                <div style={{ font: "600 10px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#9184d9' }}>NEW SKIN</div>
                <div style={{ font: "600 18px/1.2 'Inter',sans-serif", color: '#f5f4ff' }}>{reveal.result.skin.name}</div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'chestRevealSpin .6s ease-out' }}>
                  <CubeIcon size={40} topColor="#f5f4ff" leftColor="#5d5294" rightColor="#b5abfc" />
                </div>
                <div style={{ font: "600 10px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#9184d9' }}>CUBES</div>
                <div style={{ font: "700 30px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#f5f4ff' }}>
                  +{(reveal.result.cubesAmount ?? 0).toLocaleString('en-US')}
                </div>
              </>
            )}

            <button
              onClick={() => setReveal(null)}
              style={{
                width: '100%',
                height: 42,
                marginTop: 6,
                borderRadius: 12,
                border: 'none',
                background: '#b5abfc',
                color: '#161826',
                font: "600 13px/1 'Inter',sans-serif",
                cursor: 'pointer',
              }}
            >
              Nice
            </button>
          </div>
        </div>
      )}
    </MobileScreen>
  );
}
