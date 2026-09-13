import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { DailiesResponse, MyRank } from '../api/types';
import Avatar from '../components/Avatar';
import BottomNav from '../components/BottomNav';
import CubeRunner from '../components/CubeRunner';
import MobileScreen from '../components/MobileScreen';
import coin from '../assets/oops-coin.png';
import { useEquippedSkin } from '../hooks/useEquippedSkin';
import { useAuth } from '../state/AuthContext';

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#191b28', padding: '16px 14px' }}>
      <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#75798c', marginBottom: 7 }}>{label}</div>
      <div style={{ font: "600 24px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>{value}</div>
    </div>
  );
}

function ClaimForm({ onDone }: { onDone: () => void }) {
  const { claim } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await claim({ username, password, email: email || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(35,37,50,.7)',
    boxShadow: 'inset 0 0 0 1px #423a6a',
    color: '#e9e9ed',
    font: "400 13px/1 'Inter',sans-serif",
    border: 'none',
    outline: 'none',
  } as const;

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
      <input style={inputStyle} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
      <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      <input style={inputStyle} placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#f0a0a0' }}>{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        style={{ height: 40, borderRadius: 10, border: 'none', background: 'rgba(181,171,252,.12)', boxShadow: 'inset 0 0 0 1px #b5abfc', color: '#e7e5fe', font: "500 13px/1 'Inter',sans-serif", cursor: 'pointer' }}
      >
        {submitting ? 'Saving…' : 'Save progress'}
      </button>
    </form>
  );
}

export default function Profile() {
  const { player } = useAuth();
  const [rank, setRank] = useState<MyRank | null>(null);
  const [dailies, setDailies] = useState<DailiesResponse | null>(null);
  const [showClaim, setShowClaim] = useState(false);
  const skin = useEquippedSkin();

  useEffect(() => {
    api.myRank().then(setRank).catch(() => undefined);
    api.dailies().then(setDailies);
  }, []);

  if (!player) return null;

  return (
    <MobileScreen>
      <div style={{ position: 'absolute', top: -140, right: -100, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(66,58,106,.6),transparent 70%)' }} />

      <div style={{ position: 'relative', padding: '26px 20px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar displayName={player.displayName} size={64} />
        <div>
          <div style={{ font: "500 22px/1.1 'Inter',sans-serif", color: '#e9e9ed', marginBottom: 6 }}>{player.displayName}</div>
          {player.isGuest && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 7, background: 'rgba(63,66,77,.6)', boxShadow: 'inset 0 0 0 1px #595d6c', font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.08em', color: '#b2b6ca' }}>
              <i className="ph ph-ghost" style={{ fontSize: 12 }} />
              GUEST
            </div>
          )}
        </div>
      </div>

      {player.isGuest && (
        <div style={{ position: 'relative', margin: '20px 20px 0', padding: '13px 15px', borderRadius: 13, background: 'rgba(38,42,96,.5)', boxShadow: '0 0 0 1px #4c5397' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <i className="ph ph-seal-check" style={{ fontSize: 19, color: '#b5abfc' }} />
            <div style={{ flex: 1, font: "400 12px/1.35 'Inter',sans-serif", color: '#b5afe8' }}>Claim your account to keep progress, rank and balance forever.</div>
            {!showClaim && (
              <button
                onClick={() => setShowClaim(true)}
                style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(181,171,252,.12)', boxShadow: 'inset 0 0 0 1px #b5abfc', border: 'none', color: '#e7e5fe', font: "500 12px/1 'Inter',sans-serif", cursor: 'pointer' }}
              >
                Claim
              </button>
            )}
          </div>
          {showClaim && <ClaimForm onDone={() => setShowClaim(false)} />}
        </div>
      )}

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, margin: '24px 20px 0', background: 'rgba(233,233,237,.12)' }}>
        <StatCell label="BEST SCORE" value={player.bestScore.toLocaleString('en-US')} />
        <StatCell label="WORLD RANK" value={rank ? `#${rank.rank.toLocaleString('en-US')}` : '—'} />
        <StatCell label="RUNS" value={player.runsCount.toLocaleString('en-US')} />
        <StatCell label="DISTANCE" value={`${(player.bestDistance / 1000).toFixed(1)} km`} />
      </div>

      {dailies && (
        <div style={{ position: 'relative', margin: '20px 20px 0', padding: 15, borderRadius: 14, background: 'var(--color-surface)', boxShadow: '0 0 0 1px #3f424d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <i className="ph-fill ph-fire" style={{ fontSize: 20, color: '#b5abfc' }} />
            <div>
              <div style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>{dailies.streak.currentStreak} day streak</div>
              <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#75798c' }}>Best: {dailies.streak.bestStreak} days</div>
            </div>
          </div>
          <Link to="/quests" style={{ font: "500 11px/1 'Inter',sans-serif", color: '#9184d9', textDecoration: 'none' }}>
            Quests →
          </Link>
        </div>
      )}

      <Link
        to="/skins"
        style={{
          position: 'relative',
          margin: '20px 20px 0',
          padding: '13px 15px',
          borderRadius: 14,
          background: 'var(--color-surface)',
          boxShadow: '0 0 0 1px #3f424d',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textDecoration: 'none',
        }}
      >
        <CubeRunner skin={skin} size={38} />
        <div style={{ flex: 1 }}>
          <div style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>Cube skins</div>
          <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#75798c' }}>{skin.name} equipped</div>
        </div>
        <span style={{ font: "500 11px/1 'Inter',sans-serif", color: '#9184d9' }}>Change →</span>
      </Link>

      <div style={{ position: 'relative', margin: '20px 20px 0' }}>
        <div style={{ font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c', marginBottom: 12 }}>WALLET</div>
        <div style={{ padding: 16, borderRadius: 16, background: '#1a1c2b', boxShadow: '0 0 0 1px #423a6a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={coin} alt="!OOPS!" style={{ width: 34, height: 34, flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ font: "500 15px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>!OOPS! · OP$</div>
              <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#75798c' }}>Pre-launch accrual — nothing to trade yet</div>
            </div>
            <Link to="/oops" style={{ font: "500 11px/1 'Inter',sans-serif", color: '#b5abfc', textDecoration: 'none' }}>
              Details
            </Link>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav />
    </MobileScreen>
  );
}
