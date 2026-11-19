import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

const announcementSchema = z.object({
  title: z.string().min(3).max(150),
  content: z.string().min(10).max(3000),
  category: z.string().max(50).default('General'),
  isUrgent: z.boolean().default(false),
});

// 1. Get college-exclusive campus announcements
router.get('/announcements', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.collegeName) {
      return error(res, 'You must register a college to view the Campus Board', 400);
    }

    const announcements = await prisma.campusAnnouncement.findMany({
      where: { collegeName: user.collegeName },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            course: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(
      res,
      { collegeName: user.collegeName, announcements },
      `Announcements for ${user.collegeName}`
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 2. Post announcement to your college board
router.post('/announcements', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.collegeName) {
      return error(res, 'You must register a college before posting an announcement', 400);
    }

    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const announcement = await prisma.campusAnnouncement.create({
      data: {
        collegeName: user.collegeName,
        title: parsed.data.title,
        content: parsed.data.content,
        category: parsed.data.category,
        isUrgent: parsed.data.isUrgent,
        authorId: user.id,
      },
    });

    return success(res, { announcement }, 'Announcement posted to your Campus Board', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 3. Upvote an announcement
router.post('/announcements/:id/upvote', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.campusAnnouncement.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });

    return success(res, { announcement: updated }, 'Announcement upvoted');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
