import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { serializePrivateAccount } from '../../utils/serializers.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).optional(),
  hobbies: z.array(z.string()).optional(),
  relationshipIntention: z.enum(['Casual Connection', 'Dating Connection', 'Serious Relationship', 'Friendship']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  course: z.string().optional(),
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        education: { include: { college: true } },
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    const serialized = serializePrivateAccount(user);
    return success(res, { profile: serialized, user: serialized }, 'Current user profile retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const { displayName, bio, interests, hobbies, relationshipIntention, city, state, course } = parsed.data;

    const fullUser = await prisma.$transaction(async (tx) => {
      // 1. Update User if displayName provided
      if (displayName) {
        await tx.user.update({
          where: { id: req.user.id },
          data: { displayName },
        });
      }

      // 2. Update UserProfile
      const profileData = {};
      if (bio !== undefined) profileData.bio = bio;
      if (interests !== undefined) profileData.interests = interests;
      if (hobbies !== undefined) profileData.hobbies = hobbies;
      if (relationshipIntention !== undefined) profileData.relationshipIntention = relationshipIntention;
      if (city !== undefined) profileData.city = city;
      if (state !== undefined) profileData.state = state;

      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId: req.user.id },
          update: profileData,
          create: {
            userId: req.user.id,
            bio: bio || '',
            interests: interests || [],
            hobbies: hobbies || [],
            relationshipIntention: relationshipIntention || 'Casual Connection',
            city: city || 'Kolkata',
            state: state || 'West Bengal',
          },
        });
      }

      // 3. Update Education if course provided
      if (course) {
        await tx.education.updateMany({
          where: { userId: req.user.id },
          data: { degreeName: course },
        });
      }

      // Retrieve full updated user
      return tx.user.findUnique({
        where: { id: req.user.id },
        include: {
          profile: true,
          education: { include: { college: true } },
          photos: { orderBy: { photoOrder: 'asc' } },
        },
      });
    });

    const serialized = serializePrivateAccount(fullUser);
    return success(res, { profile: serialized, user: serialized }, 'Profile updated successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
