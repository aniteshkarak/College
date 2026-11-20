import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import prisma from './config/prisma.js';
import redis from './config/redis.js';

const httpServer = createServer(app);

// Socket.IO Real-time server
export const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || (config.corsOrigins && config.corsOrigins.includes(origin))) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by Socket.IO CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to express app for routes
app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`⚡ Socket.IO client connected: ${socket.id}`);

  // Join user room for personal notifications & alerts
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      logger.debug(`Socket ${socket.id} joined user room: user_${userId}`);
    }
  });

  // Join personal conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
    logger.debug(`Socket ${socket.id} joined conversation: conv_${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv_${conversationId}`);
    logger.debug(`Socket ${socket.id} left conversation: conv_${conversationId}`);
  });

  // Real-time message exchange
  socket.on('send_message', (data) => {
    if (data?.conversationId) {
      socket.to(`conv_${data.conversationId}`).emit('new_message', data.message);
    }
  });

  // Typing indicators
  socket.on('typing_start', (data) => {
    if (data?.conversationId) {
      socket.to(`conv_${data.conversationId}`).emit('partner_typing', {
        userId: data.userId,
        displayName: data.displayName,
      });
    }
  });

  socket.on('typing_stop', (data) => {
    if (data?.conversationId) {
      socket.to(`conv_${data.conversationId}`).emit('partner_stopped_typing', {
        userId: data.userId,
      });
    }
  });

  // Real-time "GO" button stage transition events
  socket.on('go_request_sent', (data) => {
    if (data?.matchId) {
      socket.broadcast.emit(`go_update_${data.matchId}`, {
        type: 'request',
        targetStage: data.targetStage,
        fromUser: data.fromUser,
      });
    }
  });

  socket.on('go_request_refused', (data) => {
    if (data?.matchId) {
      socket.broadcast.emit(`go_update_${data.matchId}`, {
        type: 'refusal',
        reason: data.reason,
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

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
