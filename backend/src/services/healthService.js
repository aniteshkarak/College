import { checkDatabaseConnection } from '../config/prisma.js';
import { checkRedisConnection } from '../config/redis.js';

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
    app: 'Collégé Backend API',
  };
};

export default { getHealthStatus };
