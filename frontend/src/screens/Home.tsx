import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { LeaderboardEntry } from '../api/types';
import Avatar from '../components/Avatar';
import BalancePill from '../components/BalancePill';
import BottomNav from '../components/BottomNav';
import MobileScreen from '../components/MobileScreen';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuth } from '../state/AuthContext';
import logo from '../assets/oops-logo.png';
import runner from '../assets/oops-runner.png';
import coin from '../assets/oops-coin.png';

function useTopLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    api.leaderboard(3, 0).then((page) => {
      setEntries(page.entries);
      setTotalPlayers(page.totalPlayers);
    });
    api
      .myRank()
      .then((rank) => {
        setMyRank(rank.rank);
        setBestScore(rank.bestScore);
      })
      .catch(() => undefined);
  }, []);

  return { entries, totalPlayers, myRank, bestScore };
}

export default function Home() {
  const { player } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const { entries, myRank, bestScore } = useTopLeaderboard();

  if (!player) return null;

  return isDesktop ? (
    <DesktopHome balance={player.balance} displayName={player.displayName} entries={entries} myRank={myRank} bestScore={bestScore} />
  ) : (
    <MobileHome balance={player.balance} displayName={player.displayName} entries={entries} />
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '26px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        background: index === 0 ? 'rgba(38,42,96,.55)' : 'rgba(35,37,50,.6)',
        boxShadow: index === 0 ? '0 0 0 1px #423a6a' : undefined,
      }}
    >
      <span
        style={{
          font: "600 12px/1 'Inter',sans-serif",
          fontVariantNumeric: 'tabular-nums',
          color: index === 0 ? '#b5abfc' : '#9397ab',
        }}
      >
        {String(entry.rank).padStart(2, '0')}
      </span>
      <span style={{ font: "500 14px/1 'Inter',sans-serif", color: index === 0 ? '#e9e9ed' : '#cfd3e5' }}>{entry.displayName}</span>
      <span
        style={{
          font: "600 13px/1 'Inter',sans-serif",
          fontVariantNumeric: 'tabular-nums',
          color: index === 0 ? '#d2cefd' : '#b2b6ca',
        }}
      >
        {entry.bestScore.toLocaleString('en-US')}
      </span>
    </div>
  );
}

function MobileHome({ balance, displayName, entries }: { balance: number; displayName: string; entries: LeaderboardEntry[] }) {
  return (
    <MobileScreen>
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: -60,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(145,132,217,.26),transparent 68%)',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0' }}>
        <BalancePill balance={balance} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Link
            to="/oops"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 11px',
              borderRadius: 999,
              boxShadow: 'inset 0 0 0 1px #423a6a',
              font: "600 10px/1 'Inter',sans-serif",
              letterSpacing: '.08em',
              color: '#b5abfc',
              textDecoration: 'none',
            }}
          >
            OP$
          </Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <Avatar displayName={displayName} />
          </Link>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 326, aspectRatio: '1', margin: '0 auto 4px' }}>
          <div
            style={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(145,132,217,.3),transparent 66%)',
              animation: 'oopsPulse 3.6s ease-in-out infinite',
            }}
          />
          <img
            className="lighten"
            src={logo}
            alt="!OOPS! CUBE"
            style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', animation: 'oopsBob 4.2s ease-in-out infinite' }}
          />
        </div>
        <p style={{ margin: '0 auto', maxWidth: 260, textAlign: 'center', font: "400 15px/1.45 'Inter',sans-serif", color: '#b2b6ca' }}>
          One tap. One jump. The wall does not negotiate.
        </p>
      </div>

      <div style={{ position: 'relative', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Link
          to="/run"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            height: 66,
            borderRadius: 16,
            background: 'rgba(181,171,252,.07)',
            boxShadow: 'inset 0 0 0 1.5px #b5abfc,0 0 34px rgba(145,132,217,.35)',
            font: "600 22px/1 'Inter',sans-serif",
            letterSpacing: '.16em',
            color: '#d2cefd',
            textDecoration: 'none',
          }}
        >
          <i className="ph-fill ph-play" style={{ fontSize: 18 }} />
          PLAY
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 2px 8px' }}>
            <span style={{ font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#9397ab' }}>WORLD TOP</span>
            <Link to="/leaderboard" style={{ font: "500 11px/1 'Inter',sans-serif", color: '#9184d9', textDecoration: 'none' }}>
              All →
            </Link>
          </div>
          {entries.map((entry, i) => (
            <LeaderboardRow key={entry.id} entry={entry} index={i} />
          ))}
        </div>

        <BottomNav />
      </div>
    </MobileScreen>
  );
}

function DesktopHome({
  balance,
  displayName,
  entries,
  myRank,
  bestScore,
}: {
  balance: number;
  displayName: string;
  entries: LeaderboardEntry[];
  myRank: number | null;
  bestScore: number;
}) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: 120,
          width: 760,
          height: 760,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(76,83,151,.35),transparent 66%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 44px',
          background:
            'linear-gradient(to right,transparent,rgba(233,233,237,.16) 48px,rgba(233,233,237,.16) calc(100% - 48px),transparent) bottom/100% 1px no-repeat',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <img className="lighten" src={runner} alt="" style={{ width: 30, height: 30, objectFit: 'cover', objectPosition: 'top', borderRadius: 9 }} />
          <span style={{ font: "700 15px/1 'Inter',sans-serif", letterSpacing: '-.02em', color: '#e9e9ed' }}>!OOPS! CUBE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link to="/leaderboard" style={{ font: "500 13px/1 'Inter',sans-serif", color: '#9397ab', textDecoration: 'none' }}>
            Leaderboard
          </Link>
          <Link to="/quests" style={{ font: "500 13px/1 'Inter',sans-serif", color: '#9397ab', textDecoration: 'none' }}>
            Quests
          </Link>
          <Link to="/topup" style={{ font: "500 13px/1 'Inter',sans-serif", color: '#9397ab', textDecoration: 'none' }}>
            Top up
          </Link>
          <Link to="/oops" style={{ font: "500 13px/1 'Inter',sans-serif", color: '#b5abfc', textDecoration: 'none' }}>
            !OOPS! OP$
          </Link>
          <BalancePill balance={balance} large />
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <Avatar displayName={displayName} size={30} />
          </Link>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,.78fr) minmax(0,.62fr)',
          gap: 34,
          padding: '44px 44px 0',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <span style={{ width: 8, height: 96, borderRadius: 3, background: '#b5abfc', boxShadow: '0 0 26px rgba(181,171,252,.7)' }} />
            <h1 style={{ margin: 0, font: "700 104px/.86 'Inter',sans-serif", letterSpacing: '-.05em', color: '#e9e9ed' }}>OOPS</h1>
            <span style={{ width: 8, height: 96, borderRadius: 3, background: '#b5abfc', boxShadow: '0 0 26px rgba(181,171,252,.7)' }} />
          </div>
          <h2 style={{ margin: '0 0 22px', font: "500 46px/1 'Inter',sans-serif", letterSpacing: '.3em', color: '#9184d9' }}>CUBE</h2>
          <p style={{ margin: '0 0 30px', maxWidth: 400, font: "400 17px/1.5 'Inter',sans-serif", color: '#b2b6ca' }}>
            One tap. One jump. The wall does not negotiate. Run, stack CUBES, climb the world board.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to="/run"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 11,
                height: 64,
                padding: '0 42px',
                borderRadius: 16,
                background: 'rgba(181,171,252,.07)',
                boxShadow: 'inset 0 0 0 1.5px #b5abfc,0 0 40px rgba(145,132,217,.35)',
                font: "600 21px/1 'Inter',sans-serif",
                letterSpacing: '.16em',
                color: '#d2cefd',
                textDecoration: 'none',
              }}
            >
              <i className="ph-fill ph-play" style={{ fontSize: 18 }} />
              PLAY
            </Link>
            <span style={{ font: "400 13px/1.4 'Inter',sans-serif", color: '#75798c' }}>
              No install.
              <br />
              Space or tap to jump.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img className="lighten" src={logo} alt="!OOPS! CUBE" style={{ width: 380, height: 380, objectFit: 'contain', animation: 'oopsBob 4.2s ease-in-out infinite' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c' }}>WORLD TOP</span>
            <Link to="/leaderboard" style={{ font: "500 12px/1 'Inter',sans-serif", color: '#9184d9', textDecoration: 'none' }}>
              Full board →
            </Link>
          </div>
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: i === 0 ? 'linear-gradient(100deg,#2c3170,#232532)' : 'var(--color-surface)',
                boxShadow: i === 0 ? '0 0 0 1px #4c5397' : undefined,
              }}
            >
              <span
                style={{
                  font: `${i === 0 ? 700 : 600} 12px/1 'Inter',sans-serif`,
                  fontVariantNumeric: 'tabular-nums',
                  color: i === 0 ? '#b5abfc' : '#75798c',
                }}
              >
                {String(entry.rank).padStart(2, '0')}
              </span>
              <span style={{ font: "500 14px/1 'Inter',sans-serif", color: i === 0 ? '#f5f4ff' : '#cfd3e5' }}>{entry.displayName}</span>
              <span
                style={{
                  font: "600 13px/1 'Inter',sans-serif",
                  fontVariantNumeric: 'tabular-nums',
                  color: i === 0 ? '#e7e5fe' : '#b2b6ca',
                }}
              >
                {entry.bestScore.toLocaleString('en-US')}
              </span>
            </div>
          ))}
          {myRank !== null && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                boxShadow: 'inset 0 0 0 1px #423a6a',
              }}
            >
              <span style={{ font: "700 12px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#9184d9' }}>{myRank}</span>
              <span style={{ font: "500 14px/1 'Inter',sans-serif", color: '#e9e9ed' }}>You</span>
              <span style={{ font: "600 13px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#cfd3e5' }}>
                {bestScore.toLocaleString('en-US')}
              </span>
            </div>
          )}
          <Link
            to="/oops"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 6,
              padding: '12px 14px',
              borderRadius: 12,
              boxShadow: 'inset 0 0 0 1px #3f424d',
              textDecoration: 'none',
            }}
          >
            <img src={coin} alt="!OOPS!" style={{ width: 22, height: 22, flex: 'none' }} />
            <span style={{ flex: 1, font: "400 12px/1.3 'Inter',sans-serif", color: '#9397ab' }}>!OOPS! (OP$) — earn it now, token launches later</span>
            <i className="ph ph-arrow-up-right" style={{ fontSize: 13, color: '#9184d9' }} />
          </Link>
        </div>
      </div>

      <div style={{ position: 'relative', height: 96, marginTop: 16, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, height: 2, background: 'linear-gradient(to right,transparent,#9184d9,#9184d9,transparent)' }} />
        <div
          style={{
            position: 'absolute',
            left: -260,
            right: -260,
            bottom: 0,
            height: 34,
            background: 'repeating-linear-gradient(105deg,rgba(145,132,217,.12) 0 1px,transparent 1px 26px)',
            animation: 'oopsGround 1.4s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 36,
            width: 34,
            height: 70,
            borderRadius: 3,
            background: 'linear-gradient(180deg,#3f424d,#232532)',
            boxShadow: 'inset 0 0 0 1px #595d6c',
            animation: 'oopsScroll 5s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 36,
            width: 34,
            height: 44,
            borderRadius: 3,
            background: 'linear-gradient(180deg,#3f424d,#232532)',
            boxShadow: 'inset 0 0 0 1px #595d6c',
            animation: 'oopsScroll 5s linear -2.5s infinite',
          }}
        />
      </div>
    </div>
  );
}
