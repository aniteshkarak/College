import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import { serializePublicProfile } from '../../utils/serializers.js';
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
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = incoming.map((reqItem) => {
      const publicUser = serializePublicProfile(reqItem.sender);

      return {
        id: reqItem.id,
        requestId: reqItem.id,
        senderId: reqItem.senderId,
        user: publicUser,
        likedAt: reqItem.createdAt,
        createdAt: reqItem.createdAt,
      };
    });

    return success(res, { incomingLikes: formatted, requests: formatted }, 'Incoming likes retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 1b. Get Sent Requests
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const sent = await prisma.matchRequest.findMany({
      where: {
        senderId: currentUserId,
      },
      include: {
        receiver: {
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = sent.map((reqItem) => {
      const publicUser = serializePublicProfile(reqItem.receiver);

      return {
        id: reqItem.id,
        requestId: reqItem.id,
        receiverId: reqItem.receiverId,
        status: reqItem.status,
        user: publicUser,
        sentAt: reqItem.createdAt,
        createdAt: reqItem.createdAt,
      };
    });

    return success(res, { sentRequests: formatted, requests: formatted }, 'Sent requests retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 2. Get Mutual Matches
router.get('/matches', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const matches = await prisma.match.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      include: {
        user1: {
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
        user2: {
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        goRequests: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = matches.map((m) => {
      const partner = m.user1Id === currentUserId ? m.user2 : m.user1;
      const publicUser = serializePublicProfile(partner);
      const lastMsg = m.conversation?.messages[0] || null;
      const activeGoReq = m.goRequests[0] || null;

      return {
        id: m.id,
        matchId: m.id,
        stage: m.stage,
        createdAt: m.createdAt,
        matched_at: m.createdAt,
        conversationId: m.conversation?.id || null,
        unread_count: 0,
        last_message: lastMsg
          ? {
              content: lastMsg.content,
              created_at: lastMsg.createdAt,
              sender_id: lastMsg.senderId,
              message_type: lastMsg.messageType,
            }
          : null,
        go_request: activeGoReq
          ? {
              id: activeGoReq.id,
              from: activeGoReq.initiatorId,
              targetStage: activeGoReq.targetStage,
            }
          : null,
        user: publicUser,
      };
    });

    return success(res, { matches: formatted }, 'Matches retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 3. Send Match Request (Like)
router.post('/send-request', requireAuth, async (req, res) => {
  try {
    const sender = req.user;
    const { receiverId } = req.body;

    if (!receiverId || receiverId === sender.id) {
      return error(res, 'Invalid receiver ID. You cannot like yourself.', 400);
    }

    // Check if either user has blocked the other
    const blockCheck = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: sender.id, blockedId: receiverId },
          { blockerId: receiverId, blockedId: sender.id },
        ],
      },
    });

    if (blockCheck) {
      return error(res, 'Unable to interact with this profile.', 403);
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

    const newRequest = await prisma.$transaction(async (tx) => {
      const r = await tx.matchRequest.create({
        data: {
          senderId: sender.id,
          receiverId,
          status: 'PENDING',
        },
      });

      await tx.user.update({
        where: { id: sender.id },
        data: { sentRequestsCount: { increment: 1 } },
      });

      // Create in-app notification for receiver
      await tx.notification.create({
        data: {
          userId: receiverId,
          type: 'LIKE',
          title: 'New Like Received',
          body: `${sender.displayName} sent you a match request! Check your Match Requests.`,
          data: { senderId: sender.id, requestId: r.id },
        },
      });

      return r;
    });

    return success(res, { request: newRequest }, 'Match request sent', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 4. Accept Match Request -> Creates Mutual Match & Conversation
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

    // Check if either user has blocked the other
    const blockCheck = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: matchReq.senderId, blockedId: currentUserId },
          { blockerId: currentUserId, blockedId: matchReq.senderId },
        ],
      },
    });

    if (blockCheck) {
      return error(res, 'Cannot accept request from a blocked user', 403);
    }

    // Transaction to update request, create or restore Match and Conversation idempotently
    const result = await prisma.$transaction(async (tx) => {
      await tx.matchRequest.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      });

      let match = await tx.match.findFirst({
        where: {
          OR: [
            { user1Id: matchReq.senderId, user2Id: currentUserId },
            { user1Id: currentUserId, user2Id: matchReq.senderId },
          ],
        },
        include: { conversation: true },
      });

      if (!match) {
        match = await tx.match.create({
          data: {
            user1Id: matchReq.senderId,
            user2Id: currentUserId,
            status: 'ACTIVE',
            stage: 'Friend',
          },
          include: { conversation: true },
        });
      } else if (match.status !== 'ACTIVE') {
        match = await tx.match.update({
          where: { id: match.id },
          data: { status: 'ACTIVE', stage: 'Friend' },
          include: { conversation: true },
        });
      }

      let conv = match.conversation;
      if (!conv) {
        conv = await tx.conversation.create({
          data: {
            matchId: match.id,
          },
        });
      }

      // System greeting message
      await tx.message.create({
        data: {
          conversationId: conv.id,
          senderId: currentUserId,
          content: `You and ${matchReq.sender.displayName} accepted each other and are now Mutual Friends! Start talking freely as friends.`,
          messageType: 'SYSTEM_PROMPT',
        },
      });

      // Create notification for sender
      await tx.notification.create({
        data: {
          userId: matchReq.senderId,
          type: 'MATCH',
          title: 'Mutual Match!',
          body: `${currentUser.displayName} accepted your match request! You are now Mutual Friends.`,
          data: { matchId: match.id, conversationId: conv.id },
        },
      });

      return { match, conversation: conv };
    });

    return success(res, result, 'Match accepted! You are now Mutual Friends.');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 5. Reject Match Request
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

// 6. Unmatch Users
router.post('/matches/:id/unmatch', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match || (match.user1Id !== currentUserId && match.user2Id !== currentUserId)) {
      return error(res, 'Match not found or unauthorized', 404);
    }

    await prisma.match.update({
      where: { id },
      data: { status: 'UNMATCHED' },
    });

    return success(res, null, 'Unmatched successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 7. Block User
router.post('/block', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { blockedId, reason } = req.body;

    if (!blockedId || blockedId === currentUserId) {
      return error(res, 'Invalid blocked user ID', 400);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create block record (or ignore if already blocked)
      await tx.userBlock.upsert({
        where: {
          blockerId_blockedId: { blockerId: currentUserId, blockedId },
        },
        create: {
          blockerId: currentUserId,
          blockedId,
          reason: reason || null,
        },
        update: {},
      });

      // 2. Mark any active match as BLOCKED
      await tx.match.updateMany({
        where: {
          OR: [
            { user1Id: currentUserId, user2Id: blockedId },
            { user1Id: blockedId, user2Id: currentUserId },
          ],
        },
        data: { status: 'BLOCKED' },
      });

      // 3. Mark any pending match request as REJECTED
      await tx.matchRequest.updateMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: blockedId },
            { senderId: blockedId, receiverId: currentUserId },
          ],
        },
        data: { status: 'REJECTED' },
      });
    });

    return success(res, null, 'User has been blocked successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 7b. Unblock User
router.post('/unblock', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetId = req.body?.unblockId || req.body?.blockedId || req.body?.userId;

    if (!targetId || targetId === currentUserId) {
      return error(res, 'Valid unblock user ID is required', 400);
    }

    await prisma.userBlock.deleteMany({
      where: {
        blockerId: currentUserId,
        blockedId: targetId,
      },
    });

    return success(res, null, 'User has been unblocked successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 7c. Get Blocked Users
router.get('/blocked', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const blockedRecords = await prisma.userBlock.findMany({
      where: {
        blockerId: currentUserId,
      },
      include: {
        blocked: {
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = blockedRecords.map((item) => ({
      id: item.id,
      blockedId: item.blockedId,
      blockedAt: item.createdAt,
      reason: item.reason,
      user: serializePublicProfile(item.blocked),
    }));

    return success(res, { blockedUsers: formatted }, 'Blocked users retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 8. GO Stage Transition Request (Friend -> Dating -> Relationship)
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

// 9. Accept GO Request
router.post('/:matchId/go/accept', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { conversation: true },
    });

    if (!match || (match.user1Id !== currentUserId && match.user2Id !== currentUserId)) {
      return error(res, 'Match not found or unauthorized', 404);
    }

    const pendingGo = await prisma.goStageRequest.findFirst({
      where: {
        matchId,
        status: 'PENDING',
        initiatorId: { not: currentUserId },
      },
    });

    if (!pendingGo) {
      return error(res, 'No pending GO request to accept', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.goStageRequest.update({
        where: { id: pendingGo.id },
        data: { status: 'ACCEPTED' },
      });

      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: { stage: pendingGo.targetStage },
      });

      if (match.conversation) {
        await tx.message.create({
          data: {
            conversationId: match.conversation.id,
            senderId: currentUserId,
            content: `Mutual agreement! Both of you accepted to advance to "${pendingGo.targetStage}" stage! 🎉`,
            messageType: 'SYSTEM_PROMPT',
          },
        });
      }

      return updatedMatch;
    });

    return success(res, { match: result }, `Successfully moved to ${pendingGo.targetStage} stage!`);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 10. Refuse GO Request (With explanation sent via Chat as required)
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
