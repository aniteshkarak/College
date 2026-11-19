import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { minAge = 18, maxAge = 30, gender, city } = req.query;

    const profiles = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        age: {
          gte: parseInt(minAge, 10),
          lte: parseInt(maxAge, 10),
        },
        ...(gender && gender !== 'All' ? { gender: String(gender) } : {}),
        ...(city && city !== 'All' ? { city: String(city) } : {}),
      },
      select: {
        id: true,
        displayName: true,
        age: true,
        gender: true,
        city: true,
        state: true,
        collegeName: true,
        course: true,
        relationshipIntention: true,
        currentMood: true,
        avatarUrl: true,
        bio: true,
        interests: true,
        verificationStatus: true,
      },
      take: 20,
    });

    return success(res, { profiles }, 'Discover profiles retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
