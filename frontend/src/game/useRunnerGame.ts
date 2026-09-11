import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { EndSessionResponse } from '../api/types';

const TICK_MS = 100;
const CHECKPOINT_MS = 800;
const DISTANCE_PER_TICK = 1; // 10 m/s, under the server's 15 m/s cap
const SCORE_PER_TICK = 2; // 20 pts/s baseline, under the server's 50 pts/s cap
const OBSTACLE_MIN_GAP_MS = 1500;
const OBSTACLE_MAX_GAP_MS = 2600;
const REACTION_WINDOW_MS = 700;
const CLEAR_SCORE_BONUS = 25;
const CLEAR_DISTANCE_BONUS = 5;

export type RunnerStatus = 'loading' | 'running' | 'ending' | 'crashed' | 'error';

export interface RunnerState {
  status: RunnerStatus;
  score: number;
  distance: number;
  clockSeconds: number;
  combo: number;
  danger: boolean;
  jumping: boolean;
  lastBonus: number | null;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function useRunnerGame(onEnded: (result: EndSessionResponse) => void) {
  const [state, setState] = useState<RunnerState>({
    status: 'loading',
    score: 0,
    distance: 0,
    clockSeconds: 0,
    combo: 0,
    danger: false,
    jumping: false,
    lastBonus: null,
  });

  const sessionIdRef = useRef<string | null>(null);
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  const pendingScoreRef = useRef(0);
  const pendingDistanceRef = useRef(0);
  const dangerDeadlineRef = useRef<number | null>(null);
  const nextObstacleAtRef = useRef(0);
  const startedAtRef = useRef(0);
  const endingRef = useRef(false);

  const endRun = useCallback(async () => {
    if (endingRef.current || !sessionIdRef.current) return;
    endingRef.current = true;
    setState((s) => ({ ...s, status: 'ending', danger: false }));

    try {
      if (pendingScoreRef.current > 0 || pendingDistanceRef.current > 0) {
        await api.checkpoint(sessionIdRef.current, {
          scoreDelta: pendingScoreRef.current,
          distanceDelta: pendingDistanceRef.current,
        });
        pendingScoreRef.current = 0;
        pendingDistanceRef.current = 0;
      }
      const result = await api.endSession(sessionIdRef.current, idempotencyKeyRef.current);
      setState((s) => ({ ...s, status: 'crashed', score: result.serverScore, distance: result.serverDistance }));
      onEnded(result);
    } catch {
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, [onEnded]);

  const jump = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running') return s;
      if (s.danger) {
        dangerDeadlineRef.current = null;
        pendingScoreRef.current += CLEAR_SCORE_BONUS;
        pendingDistanceRef.current += CLEAR_DISTANCE_BONUS;
        return { ...s, danger: false, jumping: true, combo: s.combo + 1, lastBonus: CLEAR_SCORE_BONUS };
      }
      return { ...s, jumping: true };
    });
    window.setTimeout(() => setState((s) => ({ ...s, jumping: false })), 500);
    window.setTimeout(() => setState((s) => (s.lastBonus !== null ? { ...s, lastBonus: null } : s)), 900);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let tickTimer: number | undefined;
    let checkpointTimer: number | undefined;

    api.startSession().then((res) => {
      if (cancelled) return;
      sessionIdRef.current = res.sessionId;
      startedAtRef.current = Date.now();
      nextObstacleAtRef.current = Date.now() + randomBetween(OBSTACLE_MIN_GAP_MS, OBSTACLE_MAX_GAP_MS);
      setState((s) => ({ ...s, status: 'running' }));

      tickTimer = window.setInterval(() => {
        setState((s) => {
          if (s.status !== 'running') return s;

          pendingScoreRef.current += SCORE_PER_TICK;
          pendingDistanceRef.current += DISTANCE_PER_TICK;

          const now = Date.now();
          let danger = s.danger;

          if (dangerDeadlineRef.current !== null && now >= dangerDeadlineRef.current) {
            dangerDeadlineRef.current = null;
            window.setTimeout(() => endRun(), 0);
            return { ...s, clockSeconds: (now - startedAtRef.current) / 1000 };
          }

          if (!danger && now >= nextObstacleAtRef.current) {
            danger = true;
            dangerDeadlineRef.current = now + REACTION_WINDOW_MS;
            nextObstacleAtRef.current = now + REACTION_WINDOW_MS + randomBetween(OBSTACLE_MIN_GAP_MS, OBSTACLE_MAX_GAP_MS);
          }

          return { ...s, danger, clockSeconds: (now - startedAtRef.current) / 1000 };
        });
      }, TICK_MS);

      checkpointTimer = window.setInterval(async () => {
        const sessionId = sessionIdRef.current;
        if (!sessionId || endingRef.current) return;
        const scoreDelta = pendingScoreRef.current;
        const distanceDelta = pendingDistanceRef.current;
        if (scoreDelta === 0 && distanceDelta === 0) return;
        pendingScoreRef.current = 0;
        pendingDistanceRef.current = 0;
        try {
          const res = await api.checkpoint(sessionId, { scoreDelta, distanceDelta });
          setState((s) => (s.status === 'running' ? { ...s, score: res.serverScore, distance: res.serverDistance } : s));
        } catch {
          // transient network hiccup — next checkpoint will catch up
        }
      }, CHECKPOINT_MS);
    });

    return () => {
      cancelled = true;
      if (tickTimer) window.clearInterval(tickTimer);
      if (checkpointTimer) window.clearInterval(checkpointTimer);
    };
  }, [endRun]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  return { state, jump };
}
