import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import notificationService from '../../services/notificationService.js';
import { success, error } from '../../utils/response.js';

const router = Router();

/**
 * 1. GET /api/v1/notifications
 * Retrieve paginated notifications for authenticated user
 * Query parameters: page (number), limit (number), isRead (boolean), type (string)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { page, limit, isRead, type } = req.query;

    let parsedIsRead;
    if (isRead === 'true' || isRead === true) parsedIsRead = true;
    else if (isRead === 'false' || isRead === false) parsedIsRead = false;

    const result = await notificationService.getNotifications(currentUserId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      isRead: parsedIsRead,
      type: typeof type === 'string' ? type.trim() : undefined,
    });

    return success(
      res,
      {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
        pagination: result.pagination,
      },
      'User notifications retrieved'
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
});

/**
 * 2. GET /api/v1/notifications/unread-count
 * Retrieve current unread notifications count for authenticated user
 */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const unreadCount = await notificationService.getUnreadCount(currentUserId);
    return success(res, { unreadCount }, 'Unread notifications count');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

/**
 * 3. PATCH /api/v1/notifications/:id/read
 * Mark single notification as read
 */
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return error(res, 'Valid notification ID is required', 400);
    }

    const updated = await notificationService.markNotificationAsRead(currentUserId, id);
    if (!updated) {
      return error(res, 'Notification not found or unauthorized', 404);
    }

    return success(res, { notification: updated }, 'Notification marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

/**
 * 4. PATCH /api/v1/notifications/read-all
 * Mark all notifications as read for authenticated user
 */
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const result = await notificationService.markAllAsRead(currentUserId);
    return success(res, result, 'All notifications marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Alias for backwards compatibility
router.post('/mark-all-read', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const result = await notificationService.markAllAsRead(currentUserId);
    return success(res, result, 'All notifications marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

/**
 * 5. DELETE /api/v1/notifications/:id
 * Delete single notification belonging to authenticated user
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return error(res, 'Valid notification ID is required', 400);
    }

    const deleted = await notificationService.deleteNotification(currentUserId, id);
    if (!deleted) {
      return error(res, 'Notification not found or unauthorized', 404);
    }

    return success(res, deleted, 'Notification deleted successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
