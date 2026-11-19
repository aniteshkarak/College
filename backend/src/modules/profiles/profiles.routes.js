import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).optional(),
  relationshipIntention: z.enum(['Casual Connection', 'Dating Connection', 'Serious Relationship']).optional(),
  avatarUrl: z.string().url().optional(),
  city: z.string().optional(),
  course: z.string().optional(),
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: parsed.data,
      select: {
        id: true,
        displayName: true,
        fullName: true,
        bio: true,
        interests: true,
        relationshipIntention: true,
        avatarUrl: true,
        city: true,
        course: true,
        collegeName: true,
      },
    });

    return success(res, { profile: updated }, 'Profile updated successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
