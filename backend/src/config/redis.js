import { Redis } from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

const redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy(times) {
    // Continuous reconnection with exponential backoff capped at 5000ms
    return Math.min(times * 500, 5000);
  },
  reconnectOnError(err) {
    if (err.message.includes('READONLY')) {
      return true;
    }
    return false;
  },
};

if (config.redis.password) {
  redisOptions.password = config.redis.password;
}

export const redis = new Redis(redisOptions);

redis.on('connect', () => {
  logger.info(`Connected to Redis on ${config.redis.host}:${config.redis.port}`);
});

redis.on('error', (err) => {
  // Silent log for background connection drops/retries
  logger.warn(`Redis connection note: ${err.message}`);
});

export const checkRedisConnection = async () => {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connecting' && redis.status !== 'connect') {
      await redis.connect().catch(() => {});
    }
    const res = await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), 2000)),
    ]);
    if (res === 'PONG') {
      return { status: 'HEALTHY', message: 'Redis connection active' };
    }
    return { status: 'DEGRADED', message: `Unexpected response: ${res}` };
  } catch (err) {
    return { status: 'DISCONNECTED', message: err.message };
  }
};

export default redis;
