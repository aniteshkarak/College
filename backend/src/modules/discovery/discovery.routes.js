import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { minAge = 18, maxAge = 35, gender, city } = req.query;

    // Filter out users already liked or blocked
    const [sentRequests, blockedUsers, blockingUsers] = await Promise.all([
      prisma.matchRequest.findMany({
        where: { senderId: currentUserId },
        select: { receiverId: true },
      }),
      prisma.userBlock.findMany({
        where: { blockerId: currentUserId },
        select: { blockedId: true },
      }),
      prisma.userBlock.findMany({
        where: { blockedId: currentUserId },
        select: { blockerId: true },
      }),
    ]);

    const excludedIds = [
      currentUserId,
      ...sentRequests.map((r) => r.receiverId),
      ...blockedUsers.map((b) => b.blockedId),
      ...blockingUsers.map((b) => b.blockerId),
    ];

    const whereClause = {
      id: { notIn: excludedIds },
      accountStatus: 'ACTIVE',
      verificationStatus: 'APPROVED',
      age: {
        gte: parseInt(minAge, 10),
        lte: parseInt(maxAge, 10),
      },
      ...(gender && gender !== 'All' ? { gender: String(gender) } : {}),
    };

    if (city && city !== 'All') {
      whereClause.profile = { city: { contains: String(city), mode: 'insensitive' } };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        education: true,
        photos: {
          orderBy: { photoOrder: 'asc' },
        },
      },
      take: 30,
    });

    const formatted = users.map((u) => {
      const p = u.profile || {};
      const edu = u.education || {};
      const photoUrls = u.photos.map((ph) => ph.photoUrl);
      const avatarUrl = photoUrls[0] || u.photos.find((ph) => ph.isMain)?.photoUrl || null;

      return {
        id: u.id,
        full_name: u.fullName,
        display_name: u.displayName,
        age: u.age,
        gender: u.gender,
        city: p.city || 'Kolkata',
        state: p.state || 'West Bengal',
        college_name: edu.collegeName || 'College',
        university_name: edu.universityName,
        course: edu.degreeName || edu.departmentStream,
        relationship_intention: p.relationshipIntention || 'Casual Connection',
        currentMood: p.currentMood || 'Want to make friends',
        avatar_url: avatarUrl,
        additional_photos: photoUrls.slice(1),
        bio: p.bio || `Student at ${edu.collegeName}`,
        interests: p.interests || [],
        hobbies: p.hobbies || [],
        verification_status: u.verificationStatus,
      };
    });

    return success(res, { profiles: formatted, users: formatted }, 'Discover profiles retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
