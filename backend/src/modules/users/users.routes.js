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

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        profile: true,
        education: true,
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    const p = user.profile || {};
    const edu = user.education || {};
    const photoUrls = (user.photos || []).map((ph) => ph.photoUrl);

    const formatted = {
      id: user.id,
      fullName: user.fullName,
      displayName: user.displayName,
      age: user.age,
      gender: user.gender,
      city: p.city,
      state: p.state,
      collegeName: edu.collegeName,
      course: edu.degreeName || edu.departmentStream,
      avatarUrl: photoUrls[0] || null,
      additionalPhotos: photoUrls.slice(1),
      bio: p.bio,
      interests: p.interests || [],
      relationshipIntention: p.relationshipIntention,
      currentMood: p.currentMood,
      verificationStatus: user.verificationStatus,
    };

    return success(res, { user: formatted }, 'User profile retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
