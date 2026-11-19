import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'HEALTHY', message: 'PostgreSQL connection active' };
  } catch (err) {
    logger.error('PostgreSQL health check failed:', err.message);
    return { status: 'DISCONNECTED', message: err.message };
  }
};

export default prisma;
