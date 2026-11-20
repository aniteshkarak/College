import { createServer } from 'http';
import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import prisma from './config/prisma.js';
import redis from './config/redis.js';
import { initSocketServer, getIo } from './services/socketService.js';

const httpServer = createServer(app);

// Initialize multi-device Socket.IO server with JWT auth and Redis adapter support
export const io = await initSocketServer(httpServer, app);

const PORT = config.port;

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`===================================================`);
  logger.info(`🚀 Collégé Backend API Server running on port ${PORT}`);
  logger.info(`📡 Health Check URL: http://localhost:${PORT}/api/v1/health`);
  logger.info(`🌐 Environment: ${config.nodeEnv}`);
  logger.info(`⚡ Real-time Socket.IO: Ready`);
  logger.info(`===================================================`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server...`);
  httpServer.close(async () => {
    logger.info('HTTP server closed. Disconnecting database & cache...');
    try {
      await prisma.$disconnect();
      redis.disconnect();
      logger.info('Prisma & Redis connections closed cleanly.');
    } catch (err) {
      logger.error('Error during teardown:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, httpServer };
