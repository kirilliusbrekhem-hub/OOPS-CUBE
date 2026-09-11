import cors from 'cors';
import express, { Express } from 'express';
import { Pool } from 'pg';
import { pool as defaultPool } from './db/pool';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/router';

export interface AppDeps {
  pool?: Pool;
}

export function createApp(deps: AppDeps = {}): Express {
  const pool = deps.pool ?? defaultPool;
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter(pool));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
