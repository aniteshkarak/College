import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

const PLAN_LIMITS = {
  free: { maxMatches: 5, maxSent: 50 },
  pro_49: { maxMatches: 20, maxSent: 100 },
  unlimited_99: { maxMatches: 99999, maxSent: 99999 },
};

// 1. Get Incoming Likes ("Who liked you" with Accept / Reject)
router.get('/incoming', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const incoming = await prisma.matchRequest.findMany({
      where: {
        receiverId: currentUserId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            age: true,
            gender: true,
            collegeName: true,
            course: true,
            currentMood: true,
            avatarUrl: true,
            bio: true,
            interests: true,
            relationshipIntention: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = incoming.map((reqItem) => ({
      requestId: reqItem.id,
      user: reqItem.sender,
      likedAt: reqItem.createdAt,
    }));

    return success(res, { incomingLikes: formatted }, 'Incoming likes retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 2. Send Match Request (Like)
router.post('/send-request', requireAuth, async (req, res) => {
  try {
    const sender = req.user;
    const { receiverId } = req.body;

    if (!receiverId || receiverId === sender.id) {
      return error(res, 'Invalid receiver ID', 400);
    }

    // Check sent request limit based on plan
    const userLimits = PLAN_LIMITS[sender.subscriptionPlan] || PLAN_LIMITS.free;
    if (sender.sentRequestsCount >= userLimits.maxSent) {
      return error(
        res,
        `Sent request limit reached (${userLimits.maxSent}). Upgrade to Campus Pro (₹49) or Campus Unlimited (₹99) to send more!`,
        403
      );
    }

    // Check if already requested or matched
    const existingReq = await prisma.matchRequest.findFirst({
      where: {
        OR: [
          { senderId: sender.id, receiverId },
          { senderId: receiverId, receiverId: sender.id },
        ],
      },
    });

    if (existingReq) {
      return error(res, 'A request or match already exists between these users', 400);
    }

    const newRequest = await prisma.matchRequest.create({
      data: {
        senderId: sender.id,
        receiverId,
        status: 'PENDING',
      },
    });

    await prisma.user.update({
      where: { id: sender.id },
      data: { sentRequestsCount: { increment: 1 } },
    });

    return success(res, { request: newRequest }, 'Match request sent', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 3. Accept Match Request -> Creates Mutual Match & Conversation
router.post('/requests/:id/accept', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const matchReq = await prisma.matchRequest.findUnique({
      where: { id },
      include: { sender: true },
    });

    if (!matchReq || matchReq.receiverId !== currentUserId) {
      return error(res, 'Match request not found or unauthorized', 404);
    }

    if (matchReq.status !== 'PENDING') {
      return error(res, `Request is already ${matchReq.status}`, 400);
    }

    // Check mutual matches quota
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    const userLimits = PLAN_LIMITS[currentUser.subscriptionPlan] || PLAN_LIMITS.free;

    const currentMatchesCount = await prisma.match.count({
      where: {
        status: 'ACTIVE',
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
    });

    if (currentMatchesCount >= userLimits.maxMatches) {
      return error(
        res,
        `Mutual matches limit reached (${userLimits.maxMatches}). Upgrade to Campus Pro (₹49/28 days) to unlock 20 matches.`,
        403
      );
    }

    // Transaction to update request, create Match and Conversation
    const result = await prisma.$transaction(async (tx) => {
      await tx.matchRequest.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      });

      const newMatch = await tx.match.create({
        data: {
          user1Id: matchReq.senderId,
          user2Id: currentUserId,
          status: 'ACTIVE',
          stage: 'Friend',
        },
      });

      const newConversation = await tx.conversation.create({
        data: {
          matchId: newMatch.id,
        },
      });

      // System greeting message
      await tx.message.create({
        data: {
          conversationId: newConversation.id,
          senderId: currentUserId,
          content: `You and ${matchReq.sender.displayName} accepted each other and are now Mutual Friends! Start talking freely as friends.`,
          messageType: 'SYSTEM_PROMPT',
        },
      });

      return { match: newMatch, conversation: newConversation };
    });

    return success(res, result, 'Match accepted! You are now Mutual Friends.');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 4. Reject Match Request
router.post('/requests/:id/reject', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const matchReq = await prisma.matchRequest.findUnique({ where: { id } });
    if (!matchReq || matchReq.receiverId !== currentUserId) {
      return error(res, 'Match request not found or unauthorized', 404);
    }

    await prisma.matchRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    return success(res, null, 'Match request declined');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 5. GO Stage Transition Request (Friend -> Dating -> Relationship)
const goTransitionSchema = z.object({
  targetStage: z.enum(['Dating', 'Relationship']),
});

router.post('/:matchId/go', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { matchId } = req.params;

    const parsed = goTransitionSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { conversation: true },
    });

    if (!match || (match.user1Id !== currentUserId && match.user2Id !== currentUserId)) {
      return error(res, 'Match not found or unauthorized', 404);
    }

    const goRequest = await prisma.goStageRequest.create({
      data: {
        matchId,
        initiatorId: currentUserId,
        targetStage: parsed.data.targetStage,
        status: 'PENDING',
      },
    });

    return success(res, { goRequest }, `GO request sent to transition to ${parsed.data.targetStage}`);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 6. Refuse GO Request (With explanation sent via Chat as required)
const refuseSchema = z.object({
  explanation: z.string().min(2, 'Please provide a polite explanation').max(500),
});

router.post('/:matchId/go/refuse', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { matchId } = req.params;

    const parsed = refuseSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { conversation: true },
    });

    if (!match || (match.user1Id !== currentUserId && match.user2Id !== currentUserId)) {
      return error(res, 'Match not found', 404);
    }

    const pendingGo = await prisma.goStageRequest.findFirst({
      where: {
        matchId,
        status: 'PENDING',
        initiatorId: { not: currentUserId },
      },
    });

    if (!pendingGo) {
      return error(res, 'No pending GO request to refuse', 404);
    }

    // Refuse and post explanation into chat
    const result = await prisma.$transaction(async (tx) => {
      const updatedGo = await tx.goStageRequest.update({
        where: { id: pendingGo.id },
        data: {
          status: 'REFUSED',
          refusalReason: parsed.data.explanation,
        },
      });

      if (match.conversation) {
        await tx.message.create({
          data: {
            conversationId: match.conversation.id,
            senderId: currentUserId,
            content: `I would prefer to stay as friends for now: "${parsed.data.explanation}"`,
            messageType: 'TEXT',
          },
        });
      }

      return updatedGo;
    });

    return success(res, { goRequest: result }, 'Stage transition politely declined and message sent to chat');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
