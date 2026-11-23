import { createServer } from 'http';
import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import prisma from './config/prisma.js';
import redis from './config/redis.js';
import { initSocketServer, getIo } from './services/socketService.js';

// Global error traps to prevent node process death on unhandled asynchronous errors
process.on('uncaughtException', (err) => {
  logger.error(`[FATAL UNCAUGHT EXCEPTION] ${err.message}`, { stack: err.stack });
  // If the error is not recoverable, let logger finish and exit, otherwise keep alive
  if (err.code === 'EADDRINUSE') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.warn(`[UNHANDLED PROMISE REJECTION] ${reason?.message || reason}`);
});

const httpServer = createServer(app);

// Initialize multi-device Socket.IO server with JWT auth and Redis adapter support
let ioInstance = null;
try {
  ioInstance = await initSocketServer(httpServer, app);
} catch (socketErr) {
  logger.error(`[SOCKET_INIT_WARNING] Socket.IO initialization warning: ${socketErr.message}`);
}
export const io = ioInstance;

const PORT = config.port;

// Handle server startup errors (e.g., EADDRINUSE)
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`===================================================`);
    logger.error(`❌ Port ${PORT} is already in use by another process.`);
    logger.error(`💡 Use 'netstat -ano | findstr :${PORT}' or taskkill to free port ${PORT}.`);
    logger.error(`===================================================`);
    process.exit(1);
  } else {
    logger.error(`Server HTTP error: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`===================================================`);
  logger.info(`🚀 Collage Story Backend API Server running on port ${PORT}`);
  logger.info(`📡 Health Check URL: http://localhost:${PORT}/api/v1/health`);
  logger.info(`🌐 Environment: ${config.nodeEnv}`);
  logger.info(`⚡ Real-time Socket.IO: Ready`);
  logger.info(`===================================================`);
});

// Graceful Shutdown with safety timeout
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server...`);

  // Safety timer to prevent hanging indefinitely
  const forceExitTimer = setTimeout(() => {
    logger.warn('Forced shutdown timeout reached (5s). Terminating process.');
    process.exit(1);
  }, 5000);
  forceExitTimer.unref();

  httpServer.close(async () => {
    logger.info('HTTP server closed. Disconnecting database & cache...');
    try {
      await prisma.$disconnect().catch(() => {});
      if (redis.status !== 'end') {
        redis.disconnect();
      }
      logger.info('Prisma & Redis connections closed cleanly.');
    } catch (err) {
      logger.error('Error during teardown:', err.message);
    }
    clearTimeout(forceExitTimer);
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, httpServer };
