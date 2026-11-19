import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  messageType: z.enum(['TEXT', 'VOICE_NOTE', 'SYSTEM_PROMPT']).default('TEXT'),
  mediaUrl: z.string().url().optional(),
  voiceDuration: z.number().int().positive().optional(),
});

// 1. Get user's active conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        match: {
          status: 'ACTIVE',
          OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
        },
      },
      include: {
        match: {
          include: {
            user1: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                collegeName: true,
                course: true,
                currentMood: true,
                avatarUrl: true,
              },
            },
            user2: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                collegeName: true,
                course: true,
                currentMood: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = conversations.map((conv) => {
      const partner = conv.match.user1Id === currentUserId ? conv.match.user2 : conv.match.user1;
      return {
        conversationId: conv.id,
        matchId: conv.matchId,
        stage: conv.match.stage,
        partner,
        lastMessage: conv.messages[0] || null,
        updatedAt: conv.updatedAt,
      };
    });

    return success(res, { conversations: formatted }, 'Conversations retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 2. Get messages in a conversation
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { match: true },
    });

    if (!conversation) {
      return error(res, 'Conversation not found', 404);
    }

    if (conversation.match.user1Id !== currentUserId && conversation.match.user2Id !== currentUserId) {
      return error(res, 'Unauthorized to view this conversation', 403);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return success(res, { messages }, 'Messages retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 3. Send message
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { match: true },
    });

    if (!conversation) {
      return error(res, 'Conversation not found', 404);
    }

    if (conversation.match.user1Id !== currentUserId && conversation.match.user2Id !== currentUserId) {
      return error(res, 'Unauthorized', 403);
    }

    const newMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: currentUserId,
        content: parsed.data.content,
        messageType: parsed.data.messageType,
        mediaUrl: parsed.data.mediaUrl,
        voiceDuration: parsed.data.voiceDuration,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return success(res, { message: newMessage }, 'Message sent', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
