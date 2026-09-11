import cors from 'cors';
import express, { Express } from 'express';
import type Redis from 'ioredis';
import { Pool } from 'pg';
import { pool as defaultPool } from './db/pool';
import { redis as defaultRedis } from './lib/redis';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/router';
import { dailiesRouter } from './modules/dailies/router';
import { gameRouter } from './modules/game/router';
import { leaderboardRouter } from './modules/leaderboard/router';
import { playersRouter } from './modules/players/router';
import { questsRouter } from './modules/quests/router';

export interface AppDeps {
  pool?: Pool;
  redis?: Redis;
}

export function createApp(deps: AppDeps = {}): Express {
  const pool = deps.pool ?? defaultPool;
  const redis = deps.redis ?? defaultRedis;
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter(pool));
  app.use('/api/players', playersRouter(pool));
  app.use('/api/game', gameRouter(pool, redis));
  app.use('/api/leaderboard', leaderboardRouter(pool, redis));
  app.use('/api/quests', questsRouter(pool));
  app.use('/api/dailies', dailiesRouter(pool));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
