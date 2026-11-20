import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { serializePublicProfile, serializePrivateAccount } from '../../utils/serializers.js';
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

    const updated = await prisma.userProfile.update({
      where: { userId: req.user.id },
      data: { currentMood: parsed.data.mood },
      select: { currentMood: true },
    });

    return success(res, { currentMood: updated.currentMood }, 'Mood updated successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

/**
 * GET /api/v1/users/:id
 * Retrieves user profile with strict privacy enforcement:
 * - Account owner receives full private account details (email, mobile, legal name)
 * - Other students receive strictly sanitized public profile (no email, mobile, or identity docs)
 * - Blocked, unapproved, or suspended profiles are inaccessible
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const targetId = req.params.id === 'me' ? req.user.id : req.params.id;
    const isSelf = req.user.id === targetId;

    // Check two-way blocking if viewing another user
    if (!isSelf) {
      const blockExists = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: req.user.id, blockedId: targetId },
            { blockerId: targetId, blockedId: req.user.id },
          ],
        },
      });

      if (blockExists) {
        return error(res, 'User profile is not available.', 404);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        profile: true,
        education: { include: { college: true } },
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    // Hide unapproved or suspended profiles from other students
    if (!isSelf && (user.accountStatus !== 'ACTIVE' || user.verificationStatus !== 'APPROVED')) {
      return error(res, 'User profile is not available.', 404);
    }

    if (isSelf) {
      const privateData = serializePrivateAccount(user);
      return success(res, { user: privateData, profile: privateData }, 'Current user profile retrieved');
    }

    // Return sanitized public profile
    const publicData = serializePublicProfile(user, {
      currentCollegeId: req.user.education?.collegeId,
      currentCollegeName: req.user.education?.collegeName || req.user.collegeName,
    });

    return success(res, { user: publicData, profile: publicData }, 'User public profile retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
