import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EndSessionResponse } from '../api/types';
import CubeIcon from '../components/CubeIcon';
import CubeRunner from '../components/CubeRunner';
import { useRunnerGame } from '../game/useRunnerGame';
import { useEquippedSkin } from '../hooks/useEquippedSkin';
import { useAuth } from '../state/AuthContext';

function formatClock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Run() {
  const navigate = useNavigate();
  const { player, refresh } = useAuth();

  const onEnded = useCallback(
    (result: EndSessionResponse) => {
      refresh();
      navigate('/result', { state: { result } });
    },
    [navigate, refresh],
  );

  const { state, jump } = useRunnerGame(onEnded);
  const skin = useEquippedSkin();

  return (
    <div style={{ minHeight: '100dvh', width: '100%', display: 'flex', justifyContent: 'center', background: '#0d0f18' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          minHeight: '100dvh',
          background: 'linear-gradient(180deg,#1b1e33 0%,#161826 52%,#0f111c 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, top: 120, height: 1, background: 'linear-gradient(to right,transparent,rgba(145,132,217,.3),transparent)' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 20px 0' }}>
          <div>
            <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.2em', color: '#75798c', marginBottom: 6 }}>SCORE</div>
            <div style={{ font: "700 52px/.86 'Inter',sans-serif", letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>
              {state.score.toLocaleString('en-US')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.2em', color: '#75798c', marginBottom: 6 }}>TIME</div>
            <div style={{ font: "600 26px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#b5abfc' }}>{formatClock(state.clockSeconds)}</div>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, padding: '16px 20px 0' }}>
          <span style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.18em', color: '#b5abfc', animation: state.combo > 0 ? 'oopsBlink 1.1s ease-in-out infinite' : undefined, opacity: state.combo > 0 ? 1 : 0 }}>
            ×{state.combo} COMBO
          </span>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right,rgba(181,171,252,.5),transparent)' }} />
          <span style={{ font: "600 11px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#9397ab' }}>{state.distance.toLocaleString('en-US')} m</span>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, top: 290, bottom: 150, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 118, height: 2, background: 'linear-gradient(to right,transparent,#9184d9,#9184d9,transparent)' }} />
          <div
            style={{
              position: 'absolute',
              left: -260,
              right: -260,
              bottom: 0,
              height: 118,
              background: 'repeating-linear-gradient(105deg,rgba(145,132,217,.14) 0 1px,transparent 1px 26px)',
              animation: state.status === 'running' ? 'oopsGround 1.1s linear infinite' : undefined,
            }}
          />

          {state.danger && (
            <div
              style={{
                position: 'absolute',
                left: 140,
                bottom: 118,
                width: 44,
                height: 132,
                borderRadius: 3,
                background: 'linear-gradient(180deg,#3f424d,#232532)',
                boxShadow: 'inset 0 0 0 1px #595d6c, 0 0 20px rgba(240,120,120,.4)',
                animation: 'obstacleApproach 0.7s linear',
              }}
            />
          )}

          <div
            style={{
              position: 'absolute',
              left: 48,
              bottom: 112,
              width: 88,
              height: 12,
              borderRadius: '50%',
              background: 'rgba(0,0,0,.55)',
              filter: 'blur(5px)',
              animation: state.jumping ? 'oopsShadow 0.5s cubic-bezier(.3,0,.4,1)' : undefined,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 46,
              bottom: 118,
              width: 90,
              height: 90,
              animation: state.jumping ? 'oopsJump 0.5s cubic-bezier(.3,0,.4,1)' : undefined,
            }}
          >
            <CubeRunner skin={skin} size={90} jumping={state.jumping} />
          </div>

          {state.lastBonus !== null && (
            <div
              style={{
                position: 'absolute',
                left: 96,
                bottom: 250,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 13px 7px 10px',
                borderRadius: 999,
                background: 'rgba(38,42,96,.92)',
                boxShadow: '0 0 0 1px #b5abfc,0 0 28px rgba(181,171,252,.45)',
                animation: 'oopsRise 0.9s ease-out',
              }}
            >
              <CubeIcon size={13} topColor="#f5f4ff" leftColor="#5d5294" rightColor="#b5abfc" />
              <span style={{ font: "700 17px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#f5f4ff' }}>+{state.lastBonus}</span>
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 20px 26px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <CubeIcon size={14} />
            <span style={{ font: "600 17px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>{(player?.balance ?? 0).toLocaleString('en-US')}</span>
            <span style={{ font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.06em', color: '#9397ab' }}>CUBES</span>
          </div>
          <div onClick={jump} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                boxShadow: state.danger ? 'inset 0 0 0 1.5px #f0a0a0' : 'inset 0 0 0 1.5px rgba(181,171,252,.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: state.danger ? '#f0a0a0' : '#b5abfc',
                  boxShadow: state.danger ? '0 0 18px rgba(240,160,160,.9)' : '0 0 18px rgba(181,171,252,.9)',
                  animation: 'oopsPulse 1s ease-in-out infinite',
                }}
              />
            </div>
            <span style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.2em', color: '#75798c' }}>TAP TO JUMP</span>
          </div>
        </div>

        {state.status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "500 13px/1 'Inter',sans-serif", color: '#9397ab' }}>
            Loading…
          </div>
        )}
        {state.status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "500 13px/1 'Inter',sans-serif", color: '#f0a0a0' }}>
            Connection lost — try again
          </div>
        )}
      </div>
    </div>
  );
}
