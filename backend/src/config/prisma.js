import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const checkDatabaseConnection = async () => {
  try {
    // 3-second timeout to avoid locking health check when DB is down
    const queryPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PostgreSQL ping timeout after 3000ms')), 3000)
    );

    await Promise.race([queryPromise, timeoutPromise]);
    return { status: 'HEALTHY', message: 'PostgreSQL connection active' };
  } catch (err) {
    logger.error('PostgreSQL health check failed:', err.message);
    return { status: 'DISCONNECTED', message: err.message };
  }
};

export default prisma;
