import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import { emitNotification, emitUnreadCount } from './socketService.js';

export const NOTIFICATION_TYPES = {
  NEW_LIKE: 'NEW_LIKE',
  LIKE_ACCEPTED: 'LIKE_ACCEPTED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  NEW_VOICE_MESSAGE: 'NEW_VOICE_MESSAGE',
  CAMPUS_ANNOUNCEMENT: 'CAMPUS_ANNOUNCEMENT',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  ADMIN_NOTICE: 'ADMIN_NOTICE',
  REPORT_UPDATE: 'REPORT_UPDATE',
};

/**
 * Format notification object for API responses and Socket.IO emissions
 * Preserves backwards compatibility with legacy `read`, `body`, and `userId` fields.
 */
export const formatNotification = (n) => {
  if (!n) return null;
  return {
    id: n.id,
    recipientId: n.recipientId,
    userId: n.recipientId,
    actorId: n.actorId || null,
    type: n.type,
    title: n.title,
    message: n.message,
    body: n.message,
    relatedEntityId: n.relatedEntityId || null,
    data: n.data || null,
    isRead: Boolean(n.isRead),
    read: Boolean(n.isRead),
    readAt: n.readAt || null,
    createdAt: n.createdAt,
    actor: n.actor
      ? {
          id: n.actor.id,
          displayName: n.actor.displayName,
          avatarUrl: n.actor.photos?.[0]?.photoUrl || null,
        }
      : null,
  };
};

/**
 * Check if two users have an active two-way block
 */
const isBlocked = async (userAId, userBId) => {
  if (!userAId || !userBId) return false;
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
  return Boolean(block);
};

/**
 * Create and dispatch a real-time notification
 * - Enforces recipient existence & active account check
 * - Enforces block check between actor and recipient
 * - Deduplicates recent identical notifications
 * - Persists to PostgreSQL
 * - Emits via Socket.IO to all recipient devices
 */
export const createNotification = async ({
  recipientId,
  actorId = null,
  type,
  title,
  message,
  relatedEntityId = null,
  data = null,
  deduplicateMinutes = 5,
}) => {
  try {
    if (!recipientId || !type || !title || !message) {
      logger.warn('createNotification missing required fields');
      return null;
    }

    // 1. Verify recipient exists and is active
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, accountStatus: true },
    });

    if (!recipient || recipient.accountStatus !== 'ACTIVE') {
      return null;
    }

    // 2. Safety & Privacy: If actorId provided, check if active, blocked, or identical
    if (actorId) {
      if (actorId === recipientId) {
        return null; // Do not notify oneself
      }

      const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true, accountStatus: true },
      });

      if (!actor || actor.accountStatus !== 'ACTIVE') {
        return null; // Suspended or inactive actor cannot dispatch notifications
      }

      const blocked = await isBlocked(actorId, recipientId);
      if (blocked) {
        logger.info(`Notification blocked between actor=${actorId} and recipient=${recipientId}`);
        return null;
      }
    }

    // 3. Deduplication check: Avoid duplicate notifications for identical logical events
    if (deduplicateMinutes > 0) {
      const since = new Date(Date.now() - deduplicateMinutes * 60 * 1000);
      const whereClause = {
        recipientId,
        type,
        actorId: actorId || null,
        relatedEntityId: relatedEntityId || null,
        createdAt: { gte: since },
      };

      // For messages, if messageId is in data, check exact messageId to allow distinct messages in same conversation
      if (data?.messageId) {
        whereClause.data = { path: ['messageId'], equals: data.messageId };
      } else {
        whereClause.title = title;
        whereClause.message = message;
      }

      const existing = await prisma.notification.findFirst({
        where: whereClause,
      });

      if (existing) {
        logger.info(`Deduplicated notification: type=${type}, recipient=${recipientId}`);
        return formatNotification(existing);
      }
    }

    // 4. Persist to PostgreSQL
    const created = await prisma.notification.create({
      data: {
        recipientId,
        actorId: actorId || null,
        type,
        title,
        message,
        relatedEntityId: relatedEntityId || null,
        data: data || undefined,
        isRead: false,
      },
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            photos: {
              orderBy: { photoOrder: 'asc' },
              take: 1,
              select: { photoUrl: true },
            },
          },
        },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId, isRead: false },
    });

    const formatted = formatNotification(created);

    // 5. Emit real-time WebSocket event to all devices of recipient
    emitNotification(recipientId, formatted, unreadCount);

    return formatted;
  } catch (err) {
    logger.error(`createNotification error: ${err.message}`);
    return null;
  }
};

/**
 * Get paginated notifications for a recipient
 */
export const getNotifications = async (recipientId, { page = 1, limit = 20, isRead, type } = {}) => {
  const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where = { recipientId };
  if (typeof isRead === 'boolean') {
    where.isRead = isRead;
  }
  if (type && typeof type === 'string') {
    const sanitizedType = type.trim().toUpperCase();
    if (NOTIFICATION_TYPES[sanitizedType]) {
      where.type = sanitizedType;
    }
  }

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            photos: {
              orderBy: { photoOrder: 'asc' },
              take: 1,
              select: { photoUrl: true },
            },
          },
        },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { recipientId, isRead: false } }),
  ]);

  return {
    notifications: notifications.map(formatNotification),
    pagination: {
      total: totalCount,
      page: Math.max(parseInt(page, 10) || 1, 1),
      limit: take,
      totalPages: Math.ceil(totalCount / take) || 1,
    },
    unreadCount,
  };
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (recipientId) => {
  return prisma.notification.count({
    where: { recipientId, isRead: false },
  });
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (recipientId, notificationId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId },
  });

  if (!notification) {
    return null;
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    include: {
      actor: {
        select: {
          id: true,
          displayName: true,
          photos: {
            where: { isMain: true },
            take: 1,
            select: { photoUrl: true },
          },
        },
      },
    },
  });

  const unreadCount = await getUnreadCount(recipientId);
  emitUnreadCount(recipientId, unreadCount);

  return formatNotification(updated);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (recipientId) => {
  await prisma.notification.updateMany({
    where: { recipientId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  emitUnreadCount(recipientId, 0);
  return { unreadCount: 0 };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (recipientId, notificationId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId },
  });

  if (!notification) {
    return null;
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  const unreadCount = await getUnreadCount(recipientId);
  if (!notification.isRead) {
    emitUnreadCount(recipientId, unreadCount);
  }

  return { success: true, id: notificationId, unreadCount };
};

export default {
  NOTIFICATION_TYPES,
  formatNotification,
  createNotification,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
};
