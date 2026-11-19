import { Redis } from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying after 3 attempts so process can terminate cleanly
    }
    return Math.min(times * 300, 1500);
  },
});

redis.on('connect', () => {
  logger.info(`Connected to Redis on ${config.redis.host}:${config.redis.port}`);
});

redis.on('error', (err) => {
  // Silent warning for dev reconnection
  logger.warn(`Redis connection note: ${err.message}`);
});

export const checkRedisConnection = async () => {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connecting' && redis.status !== 'connect') {
      await redis.connect().catch(() => {});
    }
    const res = await redis.ping();
    if (res === 'PONG') {
      return { status: 'HEALTHY', message: 'Redis connection active' };
    }
    return { status: 'DEGRADED', message: `Unexpected response: ${res}` };
  } catch (err) {
    return { status: 'DISCONNECTED', message: err.message };
  }
};

export default redis;
