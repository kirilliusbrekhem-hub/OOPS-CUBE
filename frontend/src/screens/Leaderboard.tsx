import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { LeaderboardEntry, MyRank } from '../api/types';
import BottomNav from '../components/BottomNav';
import MobileScreen from '../components/MobileScreen';

function initials(name: string): string {
  return name.slice(0, 2).toLowerCase();
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.leaderboard(50, 0), api.myRank().catch(() => null)]).then(([page, rank]) => {
      setEntries(page.entries);
      setTotalPlayers(page.totalPlayers);
      setMyRank(rank);
      setLoading(false);
    });
  }, []);

  const [first, second, third, ...rest] = entries;

  return (
    <MobileScreen>
      <div style={{ padding: '22px 20px 0' }}>
        <h3 style={{ margin: '0 0 3px', font: "500 25px/1 'Inter',sans-serif", letterSpacing: '-.02em', color: '#e9e9ed' }}>World top</h3>
        <div style={{ font: "400 12px/1 'Inter',sans-serif", color: '#75798c', fontVariantNumeric: 'tabular-nums' }}>
          {totalPlayers.toLocaleString('en-US')} players
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '16px 20px 0' }}>
        <span
          style={{
            padding: '7px 14px',
            borderRadius: 999,
            background: 'rgba(181,171,252,.14)',
            boxShadow: 'inset 0 0 0 1px #9184d9',
            font: "500 12px/1 'Inter',sans-serif",
            color: '#d2cefd',
          }}
        >
          Global
        </span>
        <span style={{ padding: '7px 14px', borderRadius: 999, font: "500 12px/1 'Inter',sans-serif", color: '#75798c' }}>Friends</span>
        <span style={{ padding: '7px 14px', borderRadius: 999, font: "500 12px/1 'Inter',sans-serif", color: '#75798c' }}>Today</span>
      </div>

      {!loading && first && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end', gap: 10, padding: '26px 20px 0' }}>
          <PodiumSlot entry={second} place={2} />
          <PodiumSlot entry={first} place={1} />
          <PodiumSlot entry={third} place={3} />
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden', padding: '4px 20px 0', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: 1,
            background: 'linear-gradient(to right,transparent,rgba(233,233,237,.16) 48px,rgba(233,233,237,.16) calc(100% - 48px),transparent)',
            marginBottom: 6,
          }}
        />
        {rest.map((entry) => (
          <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', alignItems: 'center', gap: 12, padding: '11px 4px' }}>
            <span style={{ font: "600 12px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#75798c' }}>
              {String(entry.rank).padStart(2, '0')}
            </span>
            <span style={{ font: "500 14px/1 'Inter',sans-serif", color: '#cfd3e5' }}>{entry.displayName}</span>
            <span style={{ font: "600 13px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#b2b6ca' }}>
              {entry.bestScore.toLocaleString('en-US')}
            </span>
          </div>
        ))}
      </div>

      {myRank && (
        <div style={{ padding: '0 20px 18px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 12,
              padding: '14px 15px',
              borderRadius: 14,
              background: 'linear-gradient(100deg,#2c3170,#232532)',
              boxShadow: '0 0 0 1px #b5abfc,0 -12px 30px rgba(0,0,0,.55)',
            }}
          >
            <span style={{ font: "700 15px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#d2cefd' }}>#{myRank.rank}</span>
            <div>
              <div style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#f5f4ff' }}>You · {myRank.displayName}</div>
            </div>
            <span style={{ font: "600 14px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e7e5fe' }}>
              {myRank.bestScore.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      )}

      <BottomNav />
    </MobileScreen>
  );
}

function PodiumSlot({ entry, place }: { entry: LeaderboardEntry | undefined; place: 1 | 2 | 3 }) {
  if (!entry) return <div />;
  const isFirst = place === 1;
  const barHeights: Record<number, number> = { 1: 82, 2: 52, 3: 40 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      {isFirst && <i className="ph-fill ph-crown-simple" style={{ fontSize: 18, color: '#b5abfc' }} />}
      <div
        style={{
          width: isFirst ? 46 : 34,
          height: isFirst ? 46 : 34,
          borderRadius: isFirst ? 14 : 11,
          background: isFirst ? 'linear-gradient(140deg,#423a6a,#262a60)' : '#292b31',
          boxShadow: isFirst ? '0 0 0 1px #5d5294,0 0 20px rgba(145,132,217,.4)' : 'inset 0 0 0 1px #3f424d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: `600 ${isFirst ? 16 : 13}px/1 'Inter',sans-serif`,
          color: isFirst ? '#e7e5fe' : '#b2b6ca',
        }}
      >
        {initials(entry.displayName)}
      </div>
      <div style={{ font: `500 ${isFirst ? 12 : 11}px/1.2 'Inter',sans-serif`, color: isFirst ? '#f5f4ff' : '#cfd3e5', textAlign: 'center' }}>
        {entry.displayName}
      </div>
      <div
        style={{
          font: `${isFirst ? 700 : 600} ${isFirst ? 16 : 13}px/1 'Inter',sans-serif`,
          fontVariantNumeric: 'tabular-nums',
          color: isFirst ? '#d2cefd' : '#9397ab',
        }}
      >
        {entry.bestScore.toLocaleString('en-US')}
      </div>
      <div
        style={{
          width: '100%',
          height: barHeights[place],
          borderRadius: '8px 8px 0 0',
          background: isFirst ? 'linear-gradient(180deg,#3a3f86,#262a60)' : 'linear-gradient(180deg,#292b31,#1b1c23)',
          boxShadow: isFirst ? 'inset 0 0 0 1px #4c5397' : 'inset 0 0 0 1px #3f424d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: `${isFirst ? 700 : 600} ${isFirst ? 22 : 15}px/1 'Inter',sans-serif`,
          color: isFirst ? '#e7e5fe' : '#9397ab',
        }}
      >
        {place}
      </div>
    </div>
  );
}
