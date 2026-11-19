import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

const moodSchema = z.object({
  mood: z.string().min(1).max(100),
});

router.patch('/mood', requireAuth, async (req, res) => {
  try {
    const parsed = moodSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { currentMood: parsed.data.mood },
      select: { id: true, currentMood: true, displayName: true },
    });

    return success(res, updated, 'Mood updated successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        displayName: true,
        age: true,
        gender: true,
        city: true,
        state: true,
        collegeName: true,
        course: true,
        avatarUrl: true,
        bio: true,
        interests: true,
        relationshipIntention: true,
        currentMood: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(res, { user }, 'User profile retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
