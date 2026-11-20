import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { storageService } from '../../services/storageService.js';
import { audioUpload } from '../../middleware/uploadMiddleware.js';
import { success, error } from '../../utils/response.js';
import { serializePublicProfile } from '../../utils/serializers.js';
import { z } from 'zod';

const router = Router();

const isConversationBlocked = async (match) => {
  if (!match || match.status === 'BLOCKED' || match.status === 'UNMATCHED') return true;
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: match.user1Id, blockedId: match.user2Id },
        { blockerId: match.user2Id, blockedId: match.user1Id },
      ],
    },
  });
  return Boolean(block);
};

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  messageType: z.enum(['TEXT', 'VOICE_NOTE', 'SYSTEM_PROMPT']).default('TEXT'),
  mediaUrl: z.string().optional(),
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
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const nonBlockedConversations = [];
    for (const conv of conversations) {
      if (!(await isConversationBlocked(conv.match))) {
        nonBlockedConversations.push(conv);
      }
    }

    const formatted = await Promise.all(
      nonBlockedConversations.map(async (conv) => {
        const partner = conv.match.user1Id === currentUserId ? conv.match.user2 : conv.match.user1;
        const publicPartner = serializePublicProfile(partner);

        // Calculate unread count for current user
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: currentUserId },
            isRead: false,
          },
        });

        const lastMsg = conv.messages[0] || null;

        return {
          id: conv.id,
          conversationId: conv.id,
          matchId: conv.matchId,
          stage: conv.match.stage,
          partner: publicPartner,
          lastMessage: lastMsg
            ? {
              id: lastMsg.id,
              content: lastMsg.content,
              messageType: lastMsg.messageType,
              mediaUrl: lastMsg.mediaUrl,
              voiceDuration: lastMsg.voiceDuration,
              createdAt: lastMsg.createdAt,
              senderId: lastMsg.senderId,
              isRead: lastMsg.isRead,
            }
            : null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

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
    const { limit = 100, before } = req.query;

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

    if (await isConversationBlocked(conversation.match)) {
      return error(res, 'Access denied: Conversation is blocked or inactive', 403);
    }

    const whereClause = { conversationId: id };
    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: Math.min(parseInt(limit, 10) || 100, 200),
    });

    // Mark partner's unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return success(res, { messages }, 'Messages retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 3. Send Text Message
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
      return error(res, 'Unauthorized to post to this conversation', 403);
    }

    if (await isConversationBlocked(conversation.match)) {
      return error(res, 'Access denied: Cannot send message to a blocked or inactive conversation', 403);
    }

    const recipientId = conversation.match.user1Id === currentUserId ? conversation.match.user2Id : conversation.match.user1Id;

    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: id,
          senderId: currentUserId,
          content: parsed.data.content,
          messageType: parsed.data.messageType,
          mediaUrl: parsed.data.mediaUrl || null,
          voiceDuration: parsed.data.voiceDuration || null,
        },
      });

      await tx.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      // In-app notification for recipient
      await tx.notification.create({
        data: {
          userId: recipientId,
          type: 'TEXT_MESSAGE',
          title: `New message from ${req.user.displayName}`,
          body: parsed.data.content.length > 60 ? parsed.data.content.substring(0, 57) + '...' : parsed.data.content,
          data: { conversationId: id, messageId: msg.id },
        },
      });

      return msg;
    });

    // Broadcast in real-time through Socket.IO room
    const socketIo = req.app?.get('io');
    if (socketIo) {
      socketIo.to(`conv_${id}`).emit('new_message', newMessage);
    }

    return success(res, { message: newMessage }, 'Message sent', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 4. Send Voice Message (Upload audio blob -> Private storage -> PostgreSQL -> Socket.IO)
router.post('/conversations/:id/voice', requireAuth, (req, res, next) => {
  audioUpload(req, res, async (err) => {
    if (err) {
      return error(res, err.message || 'Audio upload failed', err.statusCode || 400);
    }

    try {
      const currentUserId = req.user.id;
      const { id } = req.params;

      if (!req.file) {
        return error(res, 'Audio file is required for voice message', 400);
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

      if (await isConversationBlocked(conversation.match)) {
        return error(res, 'Access denied: Cannot send voice note to a blocked or inactive conversation', 403);
      }

      const recipientId = conversation.match.user1Id === currentUserId ? conversation.match.user2Id : conversation.match.user1Id;

      const durationSeconds = parseInt(req.body.duration, 10) || 0;
      if (durationSeconds > 60) {
        return error(res, 'Voice notes are limited to 60 seconds maximum.', 400);
      }

      // Store private audio file safely
      const stored = await storageService.storePrivateVoiceAudio(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      const newMessage = await prisma.$transaction(async (tx) => {
        const msg = await tx.message.create({
          data: {
            conversationId: id,
            senderId: currentUserId,
            content: `Voice Message (${durationSeconds > 0 ? durationSeconds + 's' : 'Audio'})`,
            messageType: 'VOICE_NOTE',
            mediaUrl: stored.filename,
            voiceDuration: durationSeconds,
          },
        });

        await tx.conversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        // In-app notification for recipient
        await tx.notification.create({
          data: {
            userId: recipientId,
            type: 'VOICE_MESSAGE',
            title: `Voice note from ${req.user.displayName}`,
            body: `Sent an audio voice message (${durationSeconds}s).`,
            data: { conversationId: id, messageId: msg.id },
          },
        });

        return msg;
      });

      // Broadcast real-time through Socket.IO
      const socketIo = req.app?.get('io');
      if (socketIo) {
        socketIo.to(`conv_${id}`).emit('new_message', newMessage);
      }

      return success(res, { message: newMessage }, 'Voice message sent successfully', 201);
    } catch (routeErr) {
      return error(res, routeErr.message, 500);
    }
  });
});

// 5. Secure Streaming of Private Voice Audio (Participant authenticated only)
router.get('/conversations/:id/messages/:messageId/audio', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id, messageId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { match: true },
    });

    if (!conversation) {
      return error(res, 'Conversation not found', 404);
    }

    // Verify conversation membership
    if (conversation.match.user1Id !== currentUserId && conversation.match.user2Id !== currentUserId) {
      return error(res, 'Access denied: You are not a participant in this conversation', 403);
    }

    if (await isConversationBlocked(conversation.match)) {
      return error(res, 'Access denied: Audio unavailable for blocked conversation', 403);
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.conversationId !== id || !message.mediaUrl) {
      return error(res, 'Audio message not found', 404);
    }

    // Stream securely from private storage
    const fileStream = storageService.getPrivateFileStream('voice', message.mediaUrl);

    res.setHeader('Content-Type', fileStream.mimeType);
    res.setHeader('Content-Length', fileStream.fileSize);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Accept-Ranges', 'bytes');

    fileStream.stream.pipe(res);
  } catch (err) {
    if (err.statusCode === 404) return error(res, 'Audio file not found in storage', 404);
    return error(res, err.message, 500);
  }
});

// 6. Mark Conversation Read
router.post('/conversations/:id/read', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return success(res, null, 'Conversation marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
