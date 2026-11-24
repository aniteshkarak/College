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

const createPostSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(5, 'Content must be at least 5 characters')
    .max(3000, 'Content cannot exceed 3000 characters'),
  category: z.string().trim().max(50).default('General'),
  postType: z.string().trim().max(30).default('POST'),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  isUrgent: z.preprocess((val) => val === true || val === 'true', z.boolean().default(false)),
  isOfficial: z.preprocess((val) => val === true || val === 'true', z.boolean().default(false)),
});

const updatePostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters')
    .optional(),
  content: z
    .string()
    .trim()
    .min(5, 'Content must be at least 5 characters')
    .max(3000, 'Content cannot exceed 3000 characters')
    .optional(),
  category: z.string().trim().max(50).optional(),
  postType: z.string().trim().max(30).optional(),
  imageUrl: z.string().trim().url().optional().or(z.literal('')).nullable(),
  isUrgent: z.preprocess((val) => val === true || val === 'true', z.boolean().optional()),
});

const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

const createEventSchema = z.object({
  title: z
    .string({ required_error: 'Event title is required' })
    .trim()
    .min(3, 'Event title must be at least 3 characters')
    .max(150, 'Event title cannot exceed 150 characters'),
  description: z
    .string({ required_error: 'Event description is required' })
    .trim()
    .min(10, 'Event description must be at least 10 characters')
    .max(3000, 'Event description cannot exceed 3000 characters'),
  category: z.string().trim().max(50).default('Cultural Fest'),
  eventDate: z.string().optional(),
  location: z.string().trim().max(150).default('Campus Auditorium'),
  organizer: z.string().trim().max(100).optional(),
  posterUrl: z.string().trim().url().optional().or(z.literal('')),
  isOfficial: z.preprocess((val) => val === true || val === 'true', z.boolean().default(false)),
});

const reportSchema = z.object({
  category: z.string().trim().default('INAPPROPRIATE'),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500),
});

// 1. College Board Overview
router.get('/board', requireActiveAccount, async (req, res) => {
  try {
    const boardInfo = await campusService.getCollegeBoardInfo(req.user);
    return success(res, boardInfo, `Campus Board for ${boardInfo.collegeName}`);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 2. Fetch paginated posts/announcements for authenticated user's verified college
const listHandler = async (req, res) => {
  try {
    const data = await campusService.listAnnouncements(req.user, req.query);
    return success(res, data, `Campus posts for ${data.collegeName}`);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
router.get('/announcements', requireActiveAccount, listHandler);
router.get('/posts', requireActiveAccount, listHandler);

// 3. Get single post/announcement with comments
const getSingleHandler = async (req, res) => {
  try {
    const post = await campusService.getSinglePost(req.user, req.params.id);
    return success(res, { post, announcement: post }, 'Post retrieved successfully');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
router.get('/announcements/:id', requireActiveAccount, getSingleHandler);
router.get('/posts/:id', requireActiveAccount, getSingleHandler);

// 4. Create post/announcement
const createHandler = (req, res, next) => {
  announcementUpload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return error(res, uploadErr.message || 'Image upload failed', uploadErr.statusCode || 400);
    }

    try {
      const parsed = createPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return error(res, 'Validation failed', 400, parsed.error.issues);
      }

      const result = await campusService.createAnnouncement(req.user, parsed.data, req.file);
      return success(
        res,
        result,
        `Post broadcast to ${req.user.education?.collegeName || 'your college'} Campus Board! 📢`,
        201
      );
    } catch (err) {
      return error(res, err.message, err.statusCode || 500, err.details);
    }
  });
};
router.post('/announcements', requireActiveAccount, createHandler);
router.post('/posts', requireActiveAccount, createHandler);

// 5. Edit post/announcement
const updateHandler = async (req, res) => {
  try {
    const parsed = updatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const updated = await campusService.updateAnnouncement(req.user, req.params.id, parsed.data);
    return success(res, { post: updated, announcement: updated }, 'Post updated successfully');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
router.put('/announcements/:id', requireActiveAccount, updateHandler);
router.put('/posts/:id', requireActiveAccount, updateHandler);

// 6. Delete post/announcement
const deleteHandler = async (req, res) => {
  try {
    const result = await campusService.deleteAnnouncement(req.user, req.params.id);
    return success(res, result, 'Post deleted from your college Campus Board.');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
router.delete('/announcements/:id', requireActiveAccount, deleteHandler);
router.delete('/posts/:id', requireActiveAccount, deleteHandler);

// 7. Toggle like / upvote post
const likeHandler = async (req, res) => {
  try {
    const result = await campusService.toggleLike(req.user, req.params.id);
    return success(res, result, result.isLiked ? 'Post liked' : 'Post unliked');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
router.post('/announcements/:id/like', requireActiveAccount, likeHandler);
router.post('/posts/:id/like', requireActiveAccount, likeHandler);
router.post('/announcements/:id/upvote', requireActiveAccount, async (req, res) => {
  try {
    const updated = await campusService.upvoteAnnouncement(req.user, req.params.id);
    return success(res, { announcement: updated, post: updated }, 'Announcement upvoted');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 8. Comments: List & Create
const listCommentsHandler = async (req, res) => {
  try {
    const data = await campusService.listComments(req.user, req.params.id, req.query);
    return success(res, data, 'Comments retrieved');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
const createCommentHandler = async (req, res) => {
  try {
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const comment = await campusService.createComment(req.user, req.params.id, parsed.data.content);
    return success(res, { comment }, 'Comment added successfully', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
router.get('/announcements/:id/comments', requireActiveAccount, listCommentsHandler);
router.get('/posts/:id/comments', requireActiveAccount, listCommentsHandler);
router.post('/announcements/:id/comments', requireActiveAccount, createCommentHandler);
router.post('/posts/:id/comments', requireActiveAccount, createCommentHandler);

// 9. Comments: Edit & Delete
router.put('/comments/:id', requireActiveAccount, async (req, res) => {
  try {
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }
    const updated = await campusService.updateComment(req.user, req.params.id, parsed.data.content);
    return success(res, { comment: updated }, 'Comment updated successfully');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

router.delete('/comments/:id', requireActiveAccount, async (req, res) => {
  try {
    const result = await campusService.deleteComment(req.user, req.params.id);
    return success(res, result, 'Comment removed successfully');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 10. Bookmark / Save Post
const savePostHandler = async (req, res) => {
  try {
    const result = await campusService.toggleSavedPost(req.user, req.params.id);
    return success(res, result, result.isSaved ? 'Post bookmarked' : 'Post removed from bookmarks');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
router.post('/announcements/:id/save', requireActiveAccount, savePostHandler);
router.post('/posts/:id/save', requireActiveAccount, savePostHandler);

router.get('/saved-posts', requireActiveAccount, async (req, res) => {
  try {
    const data = await campusService.listSavedPosts(req.user, req.query);
    return success(res, data, 'Saved posts retrieved');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 11. Campus Events & Activities
router.get('/events', requireActiveAccount, async (req, res) => {
  try {
    const data = await campusService.listEvents(req.user, req.query);
    return success(res, data, `Campus events for ${data.collegeName}`);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

router.post('/events', requireActiveAccount, (req, res, next) => {
  announcementUpload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return error(res, uploadErr.message || 'Poster upload failed', uploadErr.statusCode || 400);
    }

    try {
      const parsed = createEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return error(res, 'Validation failed', 400, parsed.error.issues);
      }

      const event = await campusService.createEvent(req.user, parsed.data, req.file);
      return success(res, { event }, 'Campus event posted successfully!', 201);
    } catch (err) {
      return error(res, err.message, err.statusCode || 500);
    }
  });
});

router.delete('/events/:id', requireActiveAccount, async (req, res) => {
  try {
    const result = await campusService.deleteEvent(req.user, req.params.id);
    return success(res, result, 'Campus event deleted.');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 12. Safety & Moderation: Reports
const reportPostHandler = async (req, res) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }
    const result = await campusService.reportPost(
      req.user,
      req.params.id,
      parsed.data.category,
      parsed.data.reason
    );
    return success(res, result, 'Post reported to moderators for review.');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
router.post('/announcements/:id/report', requireActiveAccount, reportPostHandler);
router.post('/posts/:id/report', requireActiveAccount, reportPostHandler);

router.post('/comments/:id/report', requireActiveAccount, async (req, res) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }
    const result = await campusService.reportComment(
      req.user,
      req.params.id,
      parsed.data.category,
      parsed.data.reason
    );
    return success(res, result, 'Comment reported to moderators for review.');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 13. Get today's announcement usage & remaining daily allowance
router.get('/usage', requireActiveAccount, async (req, res) => {
  try {
    const allowance = await campusService.getDailyAllowance(req.user.id);
    return success(res, allowance, allowance.message);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
});

// 14. Stream private announcement media
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

// 15. Admin moderation
router.post(
  '/announcements/:id/moderate',
  requireAdminAuth,
  requireAdminRoles('SUPER_ADMIN', 'SUPPORT_ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action = 'DELETE', reason = '' } = req.body || {};

      const result = await campusService.moderateAnnouncement(req.admin, id, action, reason);
      return success(res, { announcement: result, post: result }, `Post moderated (${action})`);
    } catch (err) {
      return error(res, err.message, err.statusCode || 500);
    }
  }
);

router.delete(
  '/admin/comments/:id',
  requireAdminAuth,
  requireAdminRoles('SUPER_ADMIN', 'SUPPORT_ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = '' } = req.body || {};

      const result = await campusService.moderateComment(req.admin, id, reason);
      return success(res, result, 'Comment moderated and removed');
    } catch (err) {
      return error(res, err.message, err.statusCode || 500);
    }
  }
);

export default router;
