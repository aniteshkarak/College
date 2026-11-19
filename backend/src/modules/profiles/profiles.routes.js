import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
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

router.put('/me', requireAuth, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const { displayName, bio, interests, hobbies, relationshipIntention, city, state, course } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
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
      const fullUser = await tx.user.findUnique({
        where: { id: req.user.id },
        include: {
          profile: true,
          education: true,
          photos: { orderBy: { photoOrder: 'asc' } },
        },
      });

      return fullUser;
    });

    const p = result.profile || {};
    const edu = result.education || {};
    const photoUrls = (result.photos || []).map((ph) => ph.photoUrl);

    return success(
      res,
      {
        profile: {
          id: result.id,
          displayName: result.displayName,
          fullName: result.fullName,
          age: result.age,
          gender: result.gender,
          bio: p.bio,
          interests: p.interests || [],
          hobbies: p.hobbies || [],
          relationshipIntention: p.relationshipIntention,
          city: p.city,
          state: p.state,
          collegeName: edu.collegeName,
          course: edu.degreeName,
          avatarUrl: photoUrls[0] || null,
          additionalPhotos: photoUrls.slice(1),
        },
      },
      'Profile updated successfully'
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
