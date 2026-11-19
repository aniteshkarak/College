import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';

const router = Router();

// 1. Get user notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: currentUserId, isRead: false },
    });

    return success(
      res,
      {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
          read: n.isRead,
          createdAt: n.createdAt,
        })),
        unreadCount,
      },
      'User notifications'
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 2. Mark single notification as read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: currentUserId },
    });

    if (!notification) {
      return error(res, 'Notification not found', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return success(res, { notification: updated }, 'Notification marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 3. Mark all notifications as read
router.post('/mark-all-read', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId: currentUserId, isRead: false },
      data: { isRead: true },
    });

    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
