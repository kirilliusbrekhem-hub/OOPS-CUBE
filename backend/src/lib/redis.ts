import Redis from 'ioredis';
import { env } from '../config/env';

export function createRedis(url: string = env.redisUrl): Redis {
  return new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
}

export const redis = createRedis();
