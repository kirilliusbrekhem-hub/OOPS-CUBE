import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DailyTaskDTO, QuestDTO, StreakDTO } from '../api/types';
import BottomNav from '../components/BottomNav';
import CubeIcon from '../components/CubeIcon';
import MobileScreen from '../components/MobileScreen';
import coin from '../assets/oops-coin.png';
import { useAuth } from '../state/AuthContext';

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function ProgressBar({ progress, target }: { progress: number; target: number }) {
  const segments = 12;
  const filled = Math.min(segments, Math.round((progress / target) * segments));
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${segments},1fr)`, gap: 3 }}>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} style={{ height: 7, borderRadius: 1, background: i < filled ? '#b5abfc' : '#3f424d' }} />
      ))}
    </div>
  );
}

function StreakCard({ streak }: { streak: StreakDTO }) {
  const activeDays = Math.min(streak.currentStreak, 7);
  return (
    <div style={{ margin: '18px 20px 0', padding: '16px 16px 14px', borderRadius: 16, background: 'linear-gradient(120deg,#262a60,#1d2040)', boxShadow: '0 0 0 1px #4c5397' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ph-fill ph-fire" style={{ fontSize: 20, color: '#b5abfc' }} />
          <span style={{ font: "700 24px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#f5f4ff' }}>{streak.currentStreak}</span>
          <span style={{ font: "500 11px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#b5afe8' }}>DAY STREAK</span>
        </div>
        <span style={{ font: "500 11px/1 'Inter',sans-serif", color: '#a7a1db' }}>×{streak.bonusMultiplier.toFixed(1)} rewards</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {WEEKDAY_LETTERS.map((letter, i) => {
          const isToday = i === activeDays - 1;
          const isFilled = i < activeDays;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative' }}>
              {isToday && (
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    width: 34,
                    height: 38,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle,rgba(245,244,255,.3),transparent 70%)',
                    animation: 'oopsPulse 2.4s ease-in-out infinite',
                  }}
                />
              )}
              {isFilled ? (
                <CubeIcon
                  size={22}
                  style={{ position: 'relative' }}
                  topColor={isToday ? '#f5f4ff' : '#d2cefd'}
                  leftColor={isToday ? '#b5abfc' : '#5d5294'}
                  rightColor={isToday ? '#e7e5fe' : '#9184d9'}
                />
              ) : (
                <span style={{ width: 22, height: 22, borderRadius: 7, boxShadow: 'inset 0 0 0 1.5px rgba(181,171,252,.35)' }} />
              )}
              <span style={{ font: `${isToday ? 600 : 500} 9px/1 'Inter',sans-serif`, color: isFilled ? '#a7a1db' : '#75798c' }}>{letter}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyRow({ task, onClaim }: { task: DailyTaskDTO; onClaim: (id: string) => void }) {
  if (task.claimed) {
    return (
      <div style={{ padding: '14px 15px', borderRadius: 14, background: 'rgba(35,37,50,.55)', boxShadow: '0 0 0 1px #3f424d', display: 'flex', alignItems: 'center', gap: 11 }}>
        <i className="ph-fill ph-check-circle" style={{ fontSize: 21, color: '#b5abfc' }} />
        <span style={{ flex: 1, font: "500 14px/1.2 'Inter',sans-serif", color: '#9397ab', textDecoration: 'line-through' }}>{task.title}</span>
        <span style={{ font: "500 11px/1 'Inter',sans-serif", color: '#9184d9' }}>Claimed</span>
      </div>
    );
  }
  return (
    <div style={{ padding: '14px 15px', borderRadius: 14, background: 'var(--color-surface)', boxShadow: '0 0 0 1px #3f424d' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 11 }}>
        <span style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>{task.title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: "600 13px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#d2cefd' }}>
          <CubeIcon size={11} />
          {task.rewardAmount}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ProgressBar progress={task.progress} target={task.target} />
        <span style={{ font: "600 11px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#9397ab' }}>
          {task.progress} / {task.target}
        </span>
      </div>
      {task.completed && (
        <button
          onClick={() => onClaim(task.id)}
          style={{
            marginTop: 11,
            width: '100%',
            height: 36,
            borderRadius: 10,
            border: 'none',
            background: 'rgba(181,171,252,.12)',
            boxShadow: 'inset 0 0 0 1px #b5abfc',
            color: '#e7e5fe',
            font: "500 12px/1 'Inter',sans-serif",
            cursor: 'pointer',
          }}
        >
          Claim
        </button>
      )}
    </div>
  );
}

function QuestRow({ quest, onClaim }: { quest: QuestDTO; onClaim: (id: string) => void }) {
  const rewardLabel = quest.paysIn === 'future_token' ? `${quest.rewardAmount} OP$` : `${quest.rewardAmount}`;
  const subtitle =
    quest.metric === 'leaderboard_rank' && quest.currentRank !== null
      ? `Currently rank #${quest.currentRank.toLocaleString('en-US')}`
      : `${quest.progress} / ${quest.target}`;

  return (
    <div style={{ padding: '14px 15px', borderRadius: 14, boxShadow: '0 0 0 1px #423a6a', display: 'flex', alignItems: 'center', gap: 12 }}>
      {quest.paysIn === 'future_token' ? (
        <img src={coin} alt="!OOPS!" style={{ width: 26, height: 26, flex: 'none' }} />
      ) : (
        <CubeIcon size={20} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>{quest.title}</div>
        <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#75798c', fontVariantNumeric: 'tabular-nums' }}>{subtitle}</div>
      </div>
      {quest.claimed ? (
        <span style={{ font: "500 11px/1 'Inter',sans-serif", color: '#9184d9' }}>Claimed</span>
      ) : quest.completed ? (
        <button
          onClick={() => onClaim(quest.id)}
          style={{ border: 'none', background: 'rgba(181,171,252,.12)', boxShadow: 'inset 0 0 0 1px #b5abfc', color: '#e7e5fe', borderRadius: 10, padding: '8px 12px', font: "500 12px/1 'Inter',sans-serif", cursor: 'pointer' }}
        >
          Claim
        </button>
      ) : (
        <span style={{ font: "600 13px/1 'Inter',sans-serif", color: '#d2cefd' }}>{rewardLabel}</span>
      )}
    </div>
  );
}

export default function Quests() {
  const { refresh } = useAuth();
  const [tasks, setTasks] = useState<DailyTaskDTO[]>([]);
  const [streak, setStreak] = useState<StreakDTO | null>(null);
  const [quests, setQuests] = useState<QuestDTO[]>([]);

  const load = useCallback(async () => {
    const [dailies, questsRes] = await Promise.all([api.dailies(), api.quests()]);
    setTasks(dailies.tasks);
    setStreak(dailies.streak);
    setQuests(questsRes.quests);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const claimDaily = useCallback(
    async (id: string) => {
      await api.claimDaily(id);
      await Promise.all([load(), refresh()]);
    },
    [load, refresh],
  );

  const claimQuest = useCallback(
    async (id: string) => {
      await api.claimQuest(id);
      await Promise.all([load(), refresh()]);
    },
    [load, refresh],
  );

  const cubeQuests = quests.filter((q) => q.paysIn === 'cubes');
  const tokenQuests = quests.filter((q) => q.paysIn === 'future_token');

  return (
    <MobileScreen>
      <div style={{ padding: '22px 20px 0' }}>
        <h3 style={{ margin: '0 0 3px', font: "500 25px/1 'Inter',sans-serif", letterSpacing: '-.02em', color: '#e9e9ed' }}>Quests</h3>
        <div style={{ font: "400 12px/1 'Inter',sans-serif", color: '#75798c' }}>Earn CUBES free</div>
      </div>

      {streak && <StreakCard streak={streak} />}

      <div style={{ padding: '22px 20px 0', font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c' }}>TODAY</div>
      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {tasks.map((task) => (
          <DailyRow key={task.id} task={task} onClaim={claimDaily} />
        ))}
      </div>

      {cubeQuests.length > 0 && (
        <>
          <div style={{ padding: '24px 20px 0', font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c' }}>QUESTS</div>
          <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {cubeQuests.map((quest) => (
              <QuestRow key={quest.id} quest={quest} onClaim={claimQuest} />
            ))}
          </div>
        </>
      )}

      {tokenQuests.length > 0 && (
        <>
          <div style={{ padding: '24px 20px 0', font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c' }}>SEASON · PAYS IN OP$</div>
          <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {tokenQuests.map((quest) => (
              <QuestRow key={quest.id} quest={quest} onClaim={claimQuest} />
            ))}
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />
      <BottomNav />
    </MobileScreen>
  );
}
