import Redis from 'ioredis';
import { createRedis } from '../../src/lib/redis';

const TEST_REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/1';

export function createTestRedis(): Redis {
  return createRedis(TEST_REDIS_URL);
}
