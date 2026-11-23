import { checkDatabaseConnection } from '../config/prisma.js';
import { checkRedisConnection } from '../config/redis.js';

export const getLivenessStatus = () => {
  return {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'Collage Story Backend API',
    mode: 'live',
  };
};

export const getReadinessStatus = async () => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  const isReady = dbHealth.status === 'HEALTHY';

  return {
    status: isReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbHealth,
    redis: redisHealth,
  };
};

export const getDatabaseHealth = async () => {
  const result = await checkDatabaseConnection();
  return {
    timestamp: new Date().toISOString(),
    ...result,
  };
};

export const getRedisHealth = async () => {
  const result = await checkRedisConnection();
  return {
    timestamp: new Date().toISOString(),
    ...result,
  };
};

export const getHealthStatus = async () => {
  const startTime = Date.now();
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  const isHealthy = dbHealth.status === 'HEALTHY' && redisHealth.status === 'HEALTHY';
  const durationMs = Date.now() - startTime;

  return {
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: durationMs,
    services: {
      database: {
        engine: 'PostgreSQL',
        status: dbHealth.status,
        message: dbHealth.message,
      },
      cache: {
        engine: 'Redis',
        status: redisHealth.status,
        message: redisHealth.message,
      },
    },
    version: '1.0.0',
    app: 'Collage Story Backend API',
  };
};

export default {
  getLivenessStatus,
  getReadinessStatus,
  getDatabaseHealth,
  getRedisHealth,
  getHealthStatus,
};
