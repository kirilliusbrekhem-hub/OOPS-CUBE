import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { EndSessionResponse, MyRank } from '../api/types';
import BottomNav from '../components/BottomNav';
import CubeIcon from '../components/CubeIcon';
import MobileScreen from '../components/MobileScreen';
import runnerImg from '../assets/oops-runner.png';
import { useAuth } from '../state/AuthContext';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { player } = useAuth();
  const [rank, setRank] = useState<MyRank | null>(null);

  const result = (location.state as { result?: EndSessionResponse } | null)?.result;

  useEffect(() => {
    if (!result) {
      navigate('/', { replace: true });
      return;
    }
    api.myRank().then(setRank).catch(() => undefined);
  }, [result, navigate]);

  if (!result || !player) return null;

  return (
    <MobileScreen background="linear-gradient(180deg,#262a60 0%,#1c1f3d 46%,#161826 100%)">
      <div style={{ position: 'absolute', top: -90, right: -90, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(76,83,151,.55),transparent 68%)' }} />

      <div style={{ position: 'relative', padding: '64px 24px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <img className="lighten" src={runnerImg} alt="" style={{ width: 84, height: 100, objectFit: 'contain', flex: 'none' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <span style={{ width: 4, height: 32, borderRadius: 2, background: '#b5abfc' }} />
            <span style={{ font: "700 34px/1 'Inter',sans-serif", letterSpacing: '-.04em', color: '#f5f4ff' }}>OOPS</span>
            <span style={{ width: 4, height: 32, borderRadius: 2, background: '#b5abfc' }} />
          </div>
          <p style={{ margin: 0, font: "400 14px/1.4 'Inter',sans-serif", color: '#b5afe8' }}>You met the wall at {result.serverDistance.toLocaleString('en-US')} m.</p>
        </div>
      </div>

      <div style={{ position: 'relative', padding: '30px 24px 0' }}>
        <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.2em', color: '#a7a1db', marginBottom: 8 }}>EARNED THIS RUN</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CubeIcon size={34} topColor="#f5f4ff" leftColor="#5d5294" rightColor="#b5abfc" style={{ filter: 'drop-shadow(0 0 18px rgba(181,171,252,.6))' }} />
          <span style={{ font: "700 62px/.86 'Inter',sans-serif", letterSpacing: '-.045em', fontVariantNumeric: 'tabular-nums', color: '#f5f4ff' }}>
            {result.rewardAmount.toLocaleString('en-US')}
          </span>
          <span style={{ font: "500 13px/1 'Inter',sans-serif", letterSpacing: '.08em', color: '#b5afe8', alignSelf: 'flex-end', paddingBottom: 6 }}>CUBES</span>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, margin: '30px 24px 0', background: 'rgba(233,233,237,.12)' }}>
        <div style={{ background: '#1b1e35', padding: '14px 12px' }}>
          <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#9397ab', marginBottom: 6 }}>SCORE</div>
          <div style={{ font: "600 20px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>{result.serverScore.toLocaleString('en-US')}</div>
        </div>
        <div style={{ background: '#1b1e35', padding: '14px 12px' }}>
          <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#9397ab', marginBottom: 6 }}>BEST</div>
          <div style={{ font: "600 20px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>{result.player.bestScore.toLocaleString('en-US')}</div>
        </div>
        <div style={{ background: '#1b1e35', padding: '14px 12px' }}>
          <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#9397ab', marginBottom: 6 }}>RANK</div>
          <div style={{ font: "600 20px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#b5abfc' }}>{rank ? `#${rank.rank.toLocaleString('en-US')}` : '—'}</div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ position: 'relative', padding: '0 20px 30px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {player.isGuest && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 15px', borderRadius: 14, background: 'rgba(66,58,106,.5)', boxShadow: '0 0 0 1px #b5abfc' }}>
            <i className="ph ph-warning-diamond" style={{ fontSize: 20, color: '#d2cefd' }} />
            <div style={{ flex: 1 }}>
              <div style={{ font: "500 13px/1.25 'Inter',sans-serif", color: '#f5f4ff' }}>Guest run — save it to keep your progress</div>
              <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#b5afe8' }}>Save it to keep {player.balance.toLocaleString('en-US')} CUBES and your rank</div>
            </div>
          </div>
        )}
        <Link
          to="/run"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            height: 62,
            borderRadius: 16,
            background: 'rgba(181,171,252,.08)',
            boxShadow: 'inset 0 0 0 1.5px #b5abfc,0 0 30px rgba(145,132,217,.35)',
            font: "600 19px/1 'Inter',sans-serif",
            letterSpacing: '.14em',
            color: '#e7e5fe',
            textDecoration: 'none',
          }}
        >
          <i className="ph-fill ph-play" style={{ fontSize: 16 }} />
          RUN AGAIN
        </Link>
        <div style={{ display: 'flex', gap: 11 }}>
          <Link
            to="/profile"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 13, boxShadow: 'inset 0 0 0 1px #595d6c', font: "500 14px/1 'Inter',sans-serif", color: '#cfd3e5', textDecoration: 'none' }}
          >
            Save progress
          </Link>
          <Link
            to="/leaderboard"
            style={{ width: 48, height: 48, borderRadius: 13, boxShadow: 'inset 0 0 0 1px #595d6c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#9397ab', textDecoration: 'none' }}
          >
            <i className="ph ph-share-network" />
          </Link>
        </div>
      </div>

      <BottomNav />
    </MobileScreen>
  );
}
