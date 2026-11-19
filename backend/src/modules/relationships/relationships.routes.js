import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';

const router = Router();

router.get('/active', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const activeRelationship = await prisma.match.findFirst({
      where: {
        stage: 'Relationship',
        status: 'ACTIVE',
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      include: {
        user1: { select: { id: true, displayName: true, avatarUrl: true, collegeName: true } },
        user2: { select: { id: true, displayName: true, avatarUrl: true, collegeName: true } },
      },
    });

    const partner = activeRelationship
      ? (activeRelationship.user1Id === currentUserId ? activeRelationship.user2 : activeRelationship.user1)
      : null;

    return success(res, { relationship: activeRelationship ? { ...activeRelationship, partner } : null });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
