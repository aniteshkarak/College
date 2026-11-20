import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireActiveAccount } from '../../middleware/activeAccountGuard.js';
import { announcementUpload } from '../../middleware/uploadMiddleware.js';
import { success, error } from '../../utils/response.js';
import campusService from './campus.service.js';
import { storageService } from '../../services/storageService.js';
import {
  requireAdminAuth,
  requireAdminRoles,
} from '../admin/auth/adminAuth.middleware.js';
import { z } from 'zod';

const router = Router();

const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Announcement title is required' })
    .trim()
    .min(3, 'Announcement title must be at least 3 characters')
    .max(150, 'Announcement title cannot exceed 150 characters'),
  content: z
    .string({ required_error: 'Announcement content is required' })
    .trim()
    .min(10, 'Announcement content must be at least 10 characters')
    .max(3000, 'Announcement content cannot exceed 3000 characters'),
  category: z.string().trim().max(50).default('Campus Event'),
  isUrgent: z.preprocess((val) => val === true || val === 'true', z.boolean().default(false)),
});

const updateAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Announcement title must be at least 3 characters')
    .max(150, 'Announcement title cannot exceed 150 characters')
    .optional(),
  content: z
    .string()
    .trim()
    .min(10, 'Announcement content must be at least 10 characters')
    .max(3000, 'Announcement content cannot exceed 3000 characters')
    .optional(),
  category: z.string().trim().max(50).optional(),
  isUrgent: z.preprocess((val) => val === true || val === 'true', z.boolean().optional()),
});

// 1. Get College Board Overview (College details, member count, and daily posting allowance)
router.get('/board', requireActiveAccount, async (req, res) => {
  try {
    const boardInfo = await campusService.getCollegeBoardInfo(req.user);
    return success(res, boardInfo, `Campus Board for ${boardInfo.collegeName}`);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 2. Fetch paginated announcements for authenticated user's verified college
router.get('/announcements', requireActiveAccount, async (req, res) => {
  try {
    const data = await campusService.listAnnouncements(req.user, req.query);
    return success(res, data, `Campus announcements for ${data.collegeName}`);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 3. Post a new announcement to your college board (enforces 5-per-day limit in Asia/Kolkata)
router.post('/announcements', requireActiveAccount, (req, res, next) => {
  announcementUpload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return error(res, uploadErr.message || 'Image upload failed', uploadErr.statusCode || 400);
    }

    try {
      const parsed = createAnnouncementSchema.safeParse(req.body);
      if (!parsed.success) {
        return error(res, 'Validation failed', 400, parsed.error.issues);
      }

      const result = await campusService.createAnnouncement(req.user, parsed.data, req.file);
      return success(
        res,
        result,
        `Announcement broadcast to ${req.user.education?.collegeName || 'your college'} Campus Board! 📢`,
        201
      );
    } catch (err) {
      return error(res, err.message, err.statusCode || 500, err.details);
    }
  });
});

// 4. Edit student's own announcement (does not consume daily posting allowance)
router.put('/announcements/:id', requireActiveAccount, async (req, res) => {
  try {
    const parsed = updateAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const updated = await campusService.updateAnnouncement(req.user, req.params.id, parsed.data);
    return success(res, { announcement: updated }, 'Announcement updated successfully');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 5. Delete student's own announcement (soft-delete retains posting record so daily allowance is NOT restored)
router.delete('/announcements/:id', requireActiveAccount, async (req, res) => {
  try {
    const result = await campusService.deleteAnnouncement(req.user, req.params.id);
    return success(res, result, 'Announcement deleted from your college Campus Board.');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 6. Get today's announcement usage & remaining daily allowance
router.get('/usage', requireActiveAccount, async (req, res) => {
  try {
    const allowance = await campusService.getDailyAllowance(req.user.id);
    return success(res, allowance, allowance.message);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 7. Upvote an announcement
router.post('/announcements/:id/upvote', requireActiveAccount, async (req, res) => {
  try {
    const updated = await campusService.upvoteAnnouncement(req.user, req.params.id);
    return success(res, { announcement: updated }, 'Announcement upvoted');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 8. Stream private announcement media
router.get('/announcements/media/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const fileStream = storageService.getPrivateFileStream('photos', filename);

    res.setHeader('Content-Type', fileStream.mimeType);
    res.setHeader('Content-Length', fileStream.fileSize);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Accept-Ranges', 'bytes');

    fileStream.stream.pipe(res);
  } catch (err) {
    return error(res, err.message || 'Media not found', err.statusCode || 404);
  }
});

// 9. Admin moderation of campus announcements
router.post(
  '/announcements/:id/moderate',
  requireAdminAuth,
  requireAdminRoles('SUPER_ADMIN', 'SUPPORT_ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action = 'DELETE', reason = '' } = req.body || {};

      const result = await campusService.moderateAnnouncement(req.admin, id, action, reason);
      return success(res, { announcement: result }, `Announcement moderated (${action})`);
    } catch (err) {
      return error(res, err.message, err.statusCode || 500);
    }
  }
);

export default router;
