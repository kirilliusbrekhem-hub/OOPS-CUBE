import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EndSessionResponse } from '../api/types';
import CubeIcon from '../components/CubeIcon';
import CubeRunner from '../components/CubeRunner';
import type { ObstacleKind } from '../game/useRunnerGame';
import { useRunnerGame } from '../game/useRunnerGame';
import { useEquippedSkin } from '../hooks/useEquippedSkin';
import { useAuth } from '../state/AuthContext';

const GROUND_OFFSET = 90;
const CUBE_SIZE = 72;

function formatClock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Obstacle({ kind }: { kind: ObstacleKind }) {
  if (kind === 'boss') {
    return (
      <div data-testid="obstacle" data-kind="boss" style={{ position: 'absolute', left: 122, bottom: GROUND_OFFSET, width: 80, height: 148, animation: 'obstacleApproach 0.85s linear' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -30,
            transform: 'translateX(-50%)',
            padding: '4px 10px',
            borderRadius: 999,
            background: '#2a1220',
            boxShadow: '0 0 0 1px #f0708a, 0 0 18px rgba(240,112,138,.6)',
            font: "700 10px/1 'Inter',sans-serif",
            letterSpacing: '.14em',
            color: '#ffb3c2',
            whiteSpace: 'nowrap',
            animation: 'oopsBlink .5s ease-in-out infinite',
          }}
        >
          BOSS
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            background: 'linear-gradient(180deg,#4a1830,#2a0f1e)',
            boxShadow: 'inset 0 0 0 1.5px #f0708a, 0 0 30px rgba(240,112,138,.55)',
            animation: 'oopsPulse 0.9s ease-in-out infinite',
          }}
        />
        <i
          className="ph-fill ph-skull"
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: 40, color: '#ffb3c2' }}
        />
      </div>
    );
  }

  if (kind === 'spike') {
    return (
      <div
        data-testid="obstacle"
        data-kind="spike"
        style={{
          position: 'absolute',
          left: 140,
          bottom: GROUND_OFFSET,
          width: 46,
          height: 64,
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          background: 'linear-gradient(180deg,#f0a0a0,#c24545)',
          boxShadow: '0 0 20px rgba(240,120,120,.5)',
          animation: 'obstacleApproach 0.7s linear',
        }}
      />
    );
  }

  if (kind === 'drone') {
    return (
      <div data-testid="obstacle" data-kind="drone" style={{ position: 'absolute', left: 142, bottom: GROUND_OFFSET + 56, width: 42, height: 42, animation: 'obstacleApproach 0.7s linear' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: 'rotate(45deg)',
            borderRadius: 8,
            background: 'linear-gradient(135deg,#7dd3fc,#6d28d9)',
            boxShadow: '0 0 22px rgba(125,211,252,.55)',
            animation: 'oopsBob 0.9s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'oopsBob 0.9s ease-in-out infinite',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fef9c3', boxShadow: '0 0 10px #fef9c3' }} />
        </div>
      </div>
    );
  }

  // wall
  return (
    <div
      data-testid="obstacle"
      data-kind="wall"
      style={{
        position: 'absolute',
        left: 140,
        bottom: GROUND_OFFSET,
        width: 40,
        height: 104,
        borderRadius: 4,
        background: 'linear-gradient(180deg,#4a4e5c,#232532)',
        boxShadow: 'inset 0 0 0 1px #666a7a, 0 0 20px rgba(0,0,0,.4)',
        animation: 'obstacleApproach 0.7s linear',
      }}
    />
  );
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 20px 0',
            boxShadow: state.obstacleKind === 'boss' && state.danger ? 'inset 0 0 60px rgba(240,112,138,.25)' : undefined,
          }}
        >
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '16px 20px 0' }}>
          <span style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.18em', color: '#b5abfc', animation: state.combo > 0 ? 'oopsBlink 1.1s ease-in-out infinite' : undefined, opacity: state.combo > 0 ? 1 : 0 }}>
            ×{state.combo} COMBO
          </span>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right,rgba(181,171,252,.5),transparent)' }} />
          <span style={{ font: "600 11px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#9397ab' }}>{state.distance.toLocaleString('en-US')} m</span>
        </div>

        <div data-testid="track" style={{ position: 'relative', flex: 1, minHeight: 270, margin: '14px 0 0', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: GROUND_OFFSET, height: 2, background: 'linear-gradient(to right,transparent,#9184d9,#9184d9,transparent)' }} />
          <div
            style={{
              position: 'absolute',
              left: -260,
              right: -260,
              bottom: 0,
              height: GROUND_OFFSET,
              background: 'repeating-linear-gradient(105deg,rgba(145,132,217,.14) 0 1px,transparent 1px 26px)',
              animation: state.status === 'running' ? 'oopsGround 1.1s linear infinite' : undefined,
            }}
          />

          {state.danger && state.obstacleKind && <Obstacle kind={state.obstacleKind} />}

          <div
            style={{
              position: 'absolute',
              left: 44,
              bottom: GROUND_OFFSET - 6,
              width: 70,
              height: 11,
              borderRadius: '50%',
              background: 'rgba(0,0,0,.55)',
              filter: 'blur(5px)',
              animation: state.jumping ? 'oopsShadow 0.5s cubic-bezier(.3,0,.4,1)' : undefined,
            }}
          />
          <div
            data-testid="cube-runner"
            data-jumping={state.jumping}
            style={{
              position: 'absolute',
              left: 46,
              bottom: GROUND_OFFSET,
              width: CUBE_SIZE,
              height: CUBE_SIZE,
              animation: state.jumping ? 'oopsJump 0.5s cubic-bezier(.3,0,.4,1)' : undefined,
            }}
          >
            <CubeRunner skin={skin} size={CUBE_SIZE} jumping={state.jumping} />
            {state.jumping && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: -4,
                  width: 30,
                  height: 14,
                  transform: 'translateX(-50%)',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle,rgba(181,171,252,.55),transparent 70%)',
                  animation: 'oopsDust .35s ease-out',
                  animationDelay: '.38s',
                  animationFillMode: 'backwards',
                }}
              />
            )}
          </div>

          {state.lastBonus !== null && (
            <div
              style={{
                position: 'absolute',
                left: 96,
                bottom: 200,
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

        <div style={{ padding: '18px 20px 26px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
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
      </div>
    </div>
  );
}
