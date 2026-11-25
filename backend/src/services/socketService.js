import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import prisma from '../config/prisma.js';

// Global Socket.IO instance and multi-device connection registry
let ioInstance = null;
let pubClientInstance = null;
let subClientInstance = null;

// Registry: Map<userId, Set<socket>>
const userSocketsMap = new Map();

// In-memory idempotency cache for deduplication (fallback/companion to Redis)
const idempotencyCache = new Map();

/**
 * Clean expired idempotency keys (older than 24 hours)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyCache.entries()) {
    if (now - record.timestamp > 24 * 60 * 60 * 1000) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 60 * 1000).unref();

/**
 * Verify if conversation is blocked
 */
const isConversationBlocked = async (match) => {
  if (!match || match.status === 'BLOCKED' || match.status === 'UNMATCHED') return true;
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: match.user1Id, blockedId: match.user2Id },
        { blockerId: match.user2Id, blockedId: match.user1Id },
      ],
    },
  });
  return Boolean(block);
};

/**
 * Initialize Socket.IO Server with multi-device session support and Redis adapter
 */
export const initSocketServer = async (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          config.nodeEnv === 'development' ||
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
          (config.corsOrigins && config.corsOrigins.includes(origin))
        ) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by Socket.IO CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  ioInstance = io;
  if (app) {
    app.set('io', io);
  }

  // Attempt to attach Redis adapter for multi-instance scaling
  if (config.redis?.host) {
    try {
      const pubClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      });
      pubClient.on('error', () => { });
      const subClient = pubClient.duplicate();
      subClient.on('error', () => { });

      await Promise.all([pubClient.connect(), subClient.connect()]);
      pubClientInstance = pubClient;
      subClientInstance = subClient;
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('⚡ Socket.IO Redis adapter attached for horizontal scaling across instances');
    } catch (err) {
      logger.info(`⚡ Socket.IO running with default in-memory adapter`);
    }
  }

  // Authentication Middleware for all Socket connections
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const rawToken = socket.handshake.auth?.token || bearerToken || socket.handshake.query?.token;

      if (!rawToken) {
        return next(new Error('Authentication required. Missing token.'));
      }

      // Verify JWT signature
      const decoded = jwt.verify(rawToken, config.jwt.secret, {
        issuer: 'college-api',
      });

      if (!decoded?.sub) {
        return next(new Error('Invalid token payload.'));
      }

      // Verify User in PostgreSQL
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { profile: true, education: true },
      });

      if (!user) {
        return next(new Error('User not found.'));
      }

      if (user.accountStatus === 'SUSPENDED') {
        return next(new Error('Account suspended.'));
      }

      // Attach user & session metadata to socket
      socket.user = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        collegeName: user.education?.collegeName || null,
      };

      socket.sessionId = socket.handshake.auth?.sessionId || socket.handshake.query?.sessionId || null;
      socket.deviceId = socket.handshake.auth?.deviceId || socket.handshake.query?.deviceId || `dev_${socket.id}`;
      socket.deviceType = socket.handshake.auth?.deviceType || 'web';

      return next();
    } catch (err) {
      logger.warn(`Socket.IO auth rejection (${socket.id}): ${err.message}`);
      return next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (!user) return;

    logger.info(`⚡ Socket connected: user=${user.displayName} (${user.id}), socket=${socket.id}, device=${socket.deviceId}`);

    // Register socket in user's multi-device pool
    if (!userSocketsMap.has(user.id)) {
      userSocketsMap.set(user.id, new Set());
    }
    userSocketsMap.get(user.id).add(socket);

    // Auto-join authenticated user rooms (both standard and legacy aliases)
    socket.join(`user:${user.id}`);
    socket.join(`user_${user.id}`);

    if (user.collegeName) {
      socket.join(`college:${user.collegeName.trim().toLowerCase()}`);
    }

    if (socket.sessionId) {
      socket.join(`session:${socket.sessionId}`);
    }

    // Acknowledge successful session ready to client
    socket.emit('session_ready', {
      userId: user.id,
      socketId: socket.id,
      deviceId: socket.deviceId,
      activeDevices: userSocketsMap.get(user.id)?.size || 1,
      timestamp: new Date().toISOString(),
    });

    // 1. Join Conversation Room with Authorization Check
    socket.on('join_conversation', async (conversationId, ack) => {
      try {
        if (!conversationId) {
          if (ack) ack({ success: false, error: 'Conversation ID required' });
          return;
        }

        const conv = await prisma.conversation.findFirst({
          where: {
            OR: [{ id: conversationId }, { matchId: conversationId }],
          },
          include: { match: true },
        });

        if (!conv) {
          if (ack) ack({ success: false, error: 'Conversation not found' });
          return;
        }

        // Verify user is an authorized participant
        if (conv.match.user1Id !== user.id && conv.match.user2Id !== user.id) {
          if (ack) ack({ success: false, error: 'Unauthorized conversation participant' });
          return;
        }

        if (await isConversationBlocked(conv.match)) {
          if (ack) ack({ success: false, error: 'Conversation is blocked or inactive' });
          return;
        }

        socket.join(`conversation:${conv.id}`);
        socket.join(`conv_${conv.id}`);
        socket.join(`conversation:${conversationId}`);
        socket.join(`conv_${conversationId}`);

        logger.debug(`Socket ${socket.id} joined conversation: ${conv.id}`);
        if (ack) ack({ success: true, conversationId: conv.id });
      } catch (err) {
        if (ack) ack({ success: false, error: err.message });
      }
    });

    // 2. Leave Conversation Room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
        socket.leave(`conv_${conversationId}`);
      }
    });

    // 2b. Campus Board: Join / Leave Post Room for comments & live updates
    socket.on('join_post', (postId) => {
      if (postId) {
        socket.join(`post:${postId}`);
      }
    });

    socket.on('leave_post', (postId) => {
      if (postId) {
        socket.leave(`post:${postId}`);
      }
    });

    // 3. Send Message via Socket (Direct Socket.IO delivery with PostgreSQL persistence & idempotency)
    socket.on('send_message', async (data, ack) => {
      try {
        const { conversationId, content, messageType = 'TEXT', idempotencyKey, mediaUrl, voiceDuration } = data || {};

        if (!conversationId || (!content && !mediaUrl)) {
          if (ack) ack({ success: false, error: 'Missing required message parameters' });
          return;
        }

        // Check Idempotency Key to prevent duplicate messages
        if (idempotencyKey) {
          const cacheKey = `idemp:${user.id}:${idempotencyKey}`;
          if (idempotencyCache.has(cacheKey)) {
            const cachedMsg = idempotencyCache.get(cacheKey).message;
            if (ack) ack({ success: true, message: cachedMsg, duplicated: true });
            return;
          }
        }

        const conv = await prisma.conversation.findFirst({
          where: {
            OR: [{ id: conversationId }, { matchId: conversationId }],
          },
          include: { match: true },
        });

        if (!conv) {
          if (ack) ack({ success: false, error: 'Conversation not found' });
          return;
        }

        if (conv.match.user1Id !== user.id && conv.match.user2Id !== user.id) {
          if (ack) ack({ success: false, error: 'Unauthorized conversation participant' });
          return;
        }

        if (await isConversationBlocked(conv.match)) {
          if (ack) ack({ success: false, error: 'Cannot send message to blocked conversation' });
          return;
        }

        const recipientId = conv.match.user1Id === user.id ? conv.match.user2Id : conv.match.user1Id;

        // Persist message in PostgreSQL
        const newMessage = await prisma.$transaction(async (tx) => {
          const msg = await tx.message.create({
            data: {
              conversationId: conv.id,
              senderId: user.id,
              content: content || (messageType === 'VOICE_NOTE' ? 'Voice Message' : ''),
              messageType: messageType || 'TEXT',
              mediaUrl: mediaUrl || null,
              voiceDuration: voiceDuration ? parseInt(voiceDuration, 10) : null,
            },
          });

          await tx.conversation.update({
            where: { id: conv.id },
            data: { updatedAt: new Date() },
          });

          // In-app notification for recipient
          await tx.notification.create({
            data: {
              userId: recipientId,
              type: messageType === 'VOICE_NOTE' ? 'VOICE_MESSAGE' : 'TEXT_MESSAGE',
              title: `New message from ${user.displayName}`,
              body: content?.length > 60 ? content.substring(0, 57) + '...' : (content || 'Voice message'),
              data: { conversationId: conv.id, messageId: msg.id },
            },
          });

          return msg;
        });

        // Store idempotency key
        if (idempotencyKey) {
          idempotencyCache.set(`idemp:${user.id}:${idempotencyKey}`, {
            message: newMessage,
            timestamp: Date.now(),
          });
        }

        // Broadcast to recipient devices
        broadcastNewMessage(newMessage, recipientId, user.id, conv.id, socket.id);

        if (ack) {
          ack({ success: true, message: newMessage });
        }
      } catch (err) {
        logger.error(`send_message socket error: ${err.message}`);
        if (ack) ack({ success: false, error: err.message });
      }
    });

    // 4. Mark Read via Socket
    socket.on('mark_read', async (data, ack) => {
      try {
        const { conversationId } = data || {};
        if (!conversationId) return;

        const conv = await prisma.conversation.findFirst({
          where: { OR: [{ id: conversationId }, { matchId: conversationId }] },
          include: { match: true },
        });

        if (!conv) return;
        const partnerId = conv.match.user1Id === user.id ? conv.match.user2Id : conv.match.user1Id;

        await prisma.message.updateMany({
          where: {
            conversationId: conv.id,
            senderId: { not: user.id },
            isRead: false,
          },
          data: { isRead: true },
        });

        broadcastMessageRead(conv.id, user.id, partnerId);
        if (ack) ack({ success: true, conversationId: conv.id });
      } catch (err) {
        if (ack) ack({ success: false, error: err.message });
      }
    });

    // 5. Typing Indicators
    socket.on('typing_start', (data) => {
      if (data?.conversationId) {
        socket.to(`conversation:${data.conversationId}`).to(`conv_${data.conversationId}`).emit('partner_typing', {
          userId: user.id,
          displayName: user.displayName,
          conversationId: data.conversationId,
        });
      }
    });

    socket.on('typing_stop', (data) => {
      if (data?.conversationId) {
        socket.to(`conversation:${data.conversationId}`).to(`conv_${data.conversationId}`).emit('partner_stopped_typing', {
          userId: user.id,
          conversationId: data.conversationId,
        });
      }
    });

    // 6. Real-time "GO" button stage transition events
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

    // 6. Handle Disconnection (Does NOT disconnect user's other devices!)
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: user=${user.displayName}, socket=${socket.id}, reason=${reason}`);
      const userSockets = userSocketsMap.get(user.id);
      if (userSockets) {
        userSockets.delete(socket);
        if (userSockets.size === 0) {
          userSocketsMap.delete(user.id);
        }
      }
    });
  });

  return io;
};

/**
 * Broadcast new message to recipient devices and synchronize sender other devices
 */
export const broadcastNewMessage = (message, recipientId, senderId, conversationId, originSocketId = null) => {
  if (!ioInstance) return;

  const payload = {
    ...message,
    conversationId,
  };

  // 1. Deliver to all active devices of the recipient
  ioInstance.to(`user:${recipientId}`).to(`user_${recipientId}`).emit('new_message', payload);
  ioInstance.to(`conversation:${conversationId}`).to(`conv_${conversationId}`).emit('new_message', payload);

  // 2. Synchronize to all other active devices of the sender
  if (originSocketId) {
    // Exclude the socket that sent the message, sync to sender's other devices
    ioInstance.to(`user:${senderId}`).to(`user_${senderId}`).except(originSocketId).emit('message_sync', payload);
  } else {
    // Sent via HTTP REST API: deliver to all sender devices so they stay synchronized
    ioInstance.to(`user:${senderId}`).to(`user_${senderId}`).emit('message_sync', payload);
  }
};

/**
 * Broadcast read receipts across sender and recipient devices
 */
export const broadcastMessageRead = (conversationId, readerId, partnerId) => {
  if (!ioInstance) return;

  const payload = {
    conversationId,
    readBy: readerId,
    timestamp: new Date().toISOString(),
  };

  // Notify partner's devices (shows double-tick / read status)
  ioInstance.to(`user:${partnerId}`).to(`user_${partnerId}`).emit('messages_read', payload);

  // Synchronize reader's other devices (clears unread badge on phone when read on laptop)
  ioInstance.to(`user:${readerId}`).to(`user_${readerId}`).emit('messages_read', payload);
};

/**
 * Invalidate and eject all active devices from a blocked conversation
 */
export const notifyConversationBlocked = (conversationId, user1Id, user2Id) => {
  if (!ioInstance) return;

  const payload = {
    conversationId,
    status: 'BLOCKED',
    timestamp: new Date().toISOString(),
  };

  ioInstance.to(`user:${user1Id}`).to(`user_${user1Id}`).emit('conversation_blocked', payload);
  ioInstance.to(`user:${user2Id}`).to(`user_${user2Id}`).emit('conversation_blocked', payload);

  // Eject sockets from the conversation rooms
  ioInstance.in(`conversation:${conversationId}`).socketsLeave(`conversation:${conversationId}`);
  ioInstance.in(`conv_${conversationId}`).socketsLeave(`conv_${conversationId}`);
};

/**
 * Disconnect specific session socket(s) on logout or revocation
 */
export const disconnectSessionSockets = (userId, sessionId) => {
  if (!ioInstance || !sessionId) return;

  try {
    ioInstance.to(`session:${sessionId}`).emit('session_revoked', {
      sessionId,
      message: 'This device session has been revoked.',
    });
    ioInstance.in(`session:${sessionId}`).disconnectSockets(true);
  } catch (_) { }

  const userSockets = userSocketsMap.get(userId);
  if (!userSockets) return;

  for (const socket of Array.from(userSockets)) {
    if (socket.sessionId === sessionId) {
      try {
        socket.emit('session_revoked', { sessionId, message: 'This device session has been revoked.' });
        socket.disconnect(true);
      } catch (_) { }
      userSockets.delete(socket);
    }
  }

  if (userSockets.size === 0) {
    userSocketsMap.delete(userId);
  }
};

/**
 * Disconnect all sessions for a user, or all sessions except a specific one
 */
export const disconnectAllUserSessions = (userId, exceptSessionId = null) => {
  if (!ioInstance || !userId) return;

  const userSockets = userSocketsMap.get(userId);
  if (userSockets) {
    for (const socket of Array.from(userSockets)) {
      if (!exceptSessionId || socket.sessionId !== exceptSessionId) {
        try {
          socket.emit('session_revoked', {
            sessionId: socket.sessionId,
            message: 'This session has been revoked or signed out.',
          });
          socket.disconnect(true);
        } catch (_) { }
        userSockets.delete(socket);
      }
    }
    if (userSockets.size === 0) {
      userSocketsMap.delete(userId);
    }
  }

  if (!exceptSessionId) {
    try {
      ioInstance.to(`user:${userId}`).to(`user_${userId}`).emit('session_revoked', {
        message: 'All sessions have been revoked. Please log in again.',
      });
      ioInstance.in(`user:${userId}`).disconnectSockets(true);
    } catch (_) { }
  }
};

/**
 * Disconnect all sockets for a suspended user
 */
export const disconnectUserSockets = (userId) => {
  if (!ioInstance) return;

  const userSockets = userSocketsMap.get(userId);
  if (userSockets) {
    for (const socket of userSockets) {
      socket.emit('account_suspended', { message: 'Your account has been suspended by administration.' });
      socket.disconnect(true);
    }
    userSocketsMap.delete(userId);
  }
};

/**
 * Get active socket count for user
 */
export const getActiveSocketCount = (userId) => {
  return userSocketsMap.get(userId)?.size || 0;
};

/**
 * Check if idempotency key was recently processed
 */
export const getCachedMessageByIdempotency = (senderId, idempotencyKey) => {
  if (!idempotencyKey) return null;
  const entry = idempotencyCache.get(`idemp:${senderId}:${idempotencyKey}`);
  return entry ? entry.message : null;
};

/**
 * Cache message by idempotency key
 */
export const setCachedMessageByIdempotency = (senderId, idempotencyKey, message) => {
  if (!idempotencyKey || !message) return;
  idempotencyCache.set(`idemp:${senderId}:${idempotencyKey}`, {
    message,
    timestamp: Date.now(),
  });
};

export const broadcastMoodUpdate = (userId, mood, moodUpdatedAt = null) => {
  if (!ioInstance) return;
  ioInstance.emit('mood_updated', {
    userId,
    mood,
    currentMood: mood,
    moodUpdatedAt: moodUpdatedAt ? new Date(moodUpdatedAt).toISOString() : new Date().toISOString(),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit real-time notification to all active devices of recipient
 */
export const emitNotification = (recipientId, notification, unreadCount = null) => {
  if (!ioInstance || !recipientId) return;
  ioInstance.to(`user:${recipientId}`).to(`user_${recipientId}`).emit('new_notification', notification);
  if (typeof unreadCount === 'number') {
    ioInstance.to(`user:${recipientId}`).to(`user_${recipientId}`).emit('unread_notification_count', { count: unreadCount, unreadCount });
  }
};

/**
 * Emit unread notification count update across all recipient devices
 */
export const emitUnreadCount = (recipientId, unreadCount) => {
  if (!ioInstance || !recipientId) return;
  ioInstance.to(`user:${recipientId}`).to(`user_${recipientId}`).emit('unread_notification_count', { count: unreadCount, unreadCount });
};

/**
 * Campus Board Real-Time Broadcasts
 */
export const broadcastCampusPost = (collegeName, post) => {
  if (!ioInstance || !collegeName) return;
  ioInstance.to(`college:${collegeName.trim().toLowerCase()}`).emit('new_campus_post', post);
};

export const broadcastPostComment = (collegeName, postId, comment) => {
  if (!ioInstance) return;
  if (collegeName) {
    ioInstance.to(`college:${collegeName.trim().toLowerCase()}`).emit('new_post_comment', { postId, comment });
  }
  ioInstance.to(`post:${postId}`).emit('new_post_comment', { postId, comment });
};

export const broadcastPostLike = (collegeName, postId, data) => {
  if (!ioInstance) return;
  if (collegeName) {
    ioInstance.to(`college:${collegeName.trim().toLowerCase()}`).emit('post_like_updated', { postId, ...data });
  }
  ioInstance.to(`post:${postId}`).emit('post_like_updated', { postId, ...data });
};

export const broadcastCampusEvent = (collegeName, event) => {
  if (!ioInstance || !collegeName) return;
  ioInstance.to(`college:${collegeName.trim().toLowerCase()}`).emit('new_campus_event', event);
};

export const getIo = () => ioInstance;

export const closeSocketServer = async () => {
  if (ioInstance) {
    try {
      ioInstance.close();
    } catch (e) { }
    ioInstance = null;
  }
  if (pubClientInstance) {
    try {
      pubClientInstance.removeAllListeners();
      pubClientInstance.on('error', () => { });
      pubClientInstance.disconnect();
    } catch (e) { }
    pubClientInstance = null;
  }
  if (subClientInstance) {
    try {
      subClientInstance.removeAllListeners();
      subClientInstance.on('error', () => { });
      subClientInstance.disconnect();
    } catch (e) { }
    subClientInstance = null;
  }
};

export default {
  initSocketServer,
  broadcastNewMessage,
  broadcastMessageRead,
  broadcastMoodUpdate,
  emitNotification,
  emitUnreadCount,
  broadcastCampusPost,
  broadcastPostComment,
  broadcastPostLike,
  broadcastCampusEvent,
  notifyConversationBlocked,
  disconnectSessionSockets,
  disconnectAllUserSessions,
  disconnectUserSockets,
  getActiveSocketCount,
  getCachedMessageByIdempotency,
  setCachedMessageByIdempotency,
  getIo,
};
