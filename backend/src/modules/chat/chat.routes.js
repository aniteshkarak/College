import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { storageService } from '../../services/storageService.js';
import { audioUpload } from '../../middleware/uploadMiddleware.js';
import { success, error } from '../../utils/response.js';
import { serializePublicProfile } from '../../utils/serializers.js';
import socketService from '../../services/socketService.js';
import notificationService, { NOTIFICATION_TYPES } from '../../services/notificationService.js';
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
  idempotencyKey: z.string().max(100).optional(),
});

// Helper to look up conversation by either its primary ID or matchId
const findConversation = async (identifier) => {
  return prisma.conversation.findFirst({
    where: {
      OR: [{ id: identifier }, { matchId: identifier }],
    },
    include: { match: true },
  });
};

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

    // 1. Batch fetch all blocks for current user in one query (eliminates N+1 query loop)
    const userBlocks = await prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blockedUserIds = new Set(
      userBlocks.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId))
    );

    const nonBlockedConversations = conversations.filter((conv) => {
      if (!conv.match || conv.match.status === 'BLOCKED' || conv.match.status === 'UNMATCHED') return false;
      const partnerId = conv.match.user1Id === currentUserId ? conv.match.user2Id : conv.match.user1Id;
      return !blockedUserIds.has(partnerId);
    });

    // 2. Batch calculate unread counts across all active conversations in one query (eliminates N+1 count queries)
    const nonBlockedIds = nonBlockedConversations.map((c) => c.id);
    const unreadCountsGroup = nonBlockedIds.length > 0
      ? await prisma.message.groupBy({
          by: ['conversationId'],
          where: {
            conversationId: { in: nonBlockedIds },
            senderId: { not: currentUserId },
            isRead: false,
          },
          _count: { id: true },
        })
      : [];

    const unreadMap = new Map(
      unreadCountsGroup.map((item) => [item.conversationId, item._count.id])
    );

    const formatted = nonBlockedConversations.map((conv) => {
      const partner = conv.match.user1Id === currentUserId ? conv.match.user2 : conv.match.user1;
      const publicPartner = serializePublicProfile(partner);
      const unreadCount = unreadMap.get(conv.id) || 0;

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
      });

    return success(res, { conversations: formatted }, 'Conversations retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 2. Cursor-based Sync across all user conversations for reconnecting/offline devices
router.get('/sync', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { since } = req.query;

    const userMatches = await prisma.match.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      select: { id: true },
    });

    const matchIds = userMatches.map((m) => m.id);
    const conversations = await prisma.conversation.findMany({
      where: { matchId: { in: matchIds } },
      select: { id: true, matchId: true },
    });

    const conversationIds = conversations.map((c) => c.id);

    const whereClause = {
      conversationId: { in: conversationIds },
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        whereClause.createdAt = { gt: sinceDate };
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Unread count per conversation
    const unreadCounts = {};
    for (const convId of conversationIds) {
      unreadCounts[convId] = await prisma.message.count({
        where: {
          conversationId: convId,
          senderId: { not: currentUserId },
          isRead: false,
        },
      });
    }

    return success(
      res,
      {
        messages,
        unreadCounts,
        syncTimestamp: new Date().toISOString(),
      },
      'Sync completed'
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 3. Get messages in a conversation (with before/after/since cursor support)
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { limit = 100, before, after, since } = req.query;

    const conversation = await findConversation(id);

    if (!conversation) {
      return error(res, 'Conversation not found', 404);
    }

    if (conversation.match.user1Id !== currentUserId && conversation.match.user2Id !== currentUserId) {
      return error(res, 'Unauthorized to view this conversation', 403);
    }

    if (await isConversationBlocked(conversation.match)) {
      return error(res, 'Access denied: Conversation is blocked or inactive', 403);
    }

    const whereClause = { conversationId: conversation.id };

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) whereClause.createdAt = { lt: beforeDate };
    } else if (after || since) {
      const cursorDate = new Date(after || since);
      if (!isNaN(cursorDate.getTime())) whereClause.createdAt = { gt: cursorDate };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: Math.min(parseInt(limit, 10) || 100, 200),
    });

    const partnerId = conversation.match.user1Id === currentUserId ? conversation.match.user2Id : conversation.match.user1Id;

    // Mark partner's unread messages as read
    const updateResult = await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });

    if (updateResult.count > 0) {
      socketService.broadcastMessageRead(conversation.id, currentUserId, partnerId);
    }

    return success(res, { messages, conversationId: conversation.id }, 'Messages retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 4. Send Text Message (with Idempotency Key & Multi-Device Real-Time Broadcast)
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const { idempotencyKey } = parsed.data;

    // Idempotency check: if client retried request with identical key, return cached message
    if (idempotencyKey) {
      const cached = socketService.getCachedMessageByIdempotency(currentUserId, idempotencyKey);
      if (cached) {
        return success(res, { message: cached, duplicate: true }, 'Message returned from cache', 200);
      }
    }

    const conversation = await findConversation(id);

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
          conversationId: conversation.id,
          senderId: currentUserId,
          content: parsed.data.content,
          messageType: parsed.data.messageType,
          mediaUrl: parsed.data.mediaUrl || null,
          voiceDuration: parsed.data.voiceDuration || null,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    // In-app real-time notification for recipient with Socket.IO emission
    await notificationService.createNotification({
      recipientId,
      actorId: currentUserId,
      type: parsed.data.messageType === 'VOICE_NOTE' ? NOTIFICATION_TYPES.NEW_VOICE_MESSAGE : NOTIFICATION_TYPES.NEW_MESSAGE,
      title: parsed.data.messageType === 'VOICE_NOTE' ? `Voice note from ${req.user.displayName}` : `New message from ${req.user.displayName}`,
      message: parsed.data.messageType === 'VOICE_NOTE'
        ? `Sent an audio voice message (${parsed.data.voiceDuration || 0}s).`
        : (parsed.data.content.length > 80 ? parsed.data.content.substring(0, 77) + '...' : parsed.data.content),
      relatedEntityId: conversation.id,
      data: { conversationId: conversation.id, messageId: newMessage.id },
    });

    if (idempotencyKey) {
      socketService.setCachedMessageByIdempotency(currentUserId, idempotencyKey, newMessage);
    }

    // Multi-device real-time broadcast:
    // 1. Recipient's devices receive 'new_message'
    // 2. Sender's other active devices receive 'message_sync'
    socketService.broadcastNewMessage(newMessage, recipientId, currentUserId, conversation.id);

    return success(res, { message: newMessage }, 'Message sent', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// 5. Send Voice Message (Upload audio blob -> Private storage -> PostgreSQL -> Multi-Device Broadcast)
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

      const conversation = await findConversation(id);

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
            conversationId: conversation.id,
            senderId: currentUserId,
            content: `Voice Message (${durationSeconds > 0 ? durationSeconds + 's' : 'Audio'})`,
            messageType: 'VOICE_NOTE',
            mediaUrl: stored.filename,
            voiceDuration: durationSeconds,
          },
        });

        await tx.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        return msg;
      });

      // In-app real-time notification for recipient with Socket.IO emission
      await notificationService.createNotification({
        recipientId,
        actorId: currentUserId,
        type: NOTIFICATION_TYPES.NEW_VOICE_MESSAGE,
        title: `Voice note from ${req.user.displayName}`,
        message: `Sent an audio voice message (${durationSeconds}s).`,
        relatedEntityId: conversation.id,
        data: { conversationId: conversation.id, messageId: newMessage.id, duration: durationSeconds },
      });

      // Broadcast voice message metadata to recipient and sender's other devices
      socketService.broadcastNewMessage(newMessage, recipientId, currentUserId, conversation.id);

      return success(res, { message: newMessage }, 'Voice message sent successfully', 201);
    } catch (routeErr) {
      return error(res, routeErr.message, 500);
    }
  });
});

// 6. Secure Streaming of Private Voice Audio with HTTP 206 Byte Range Support (iOS Safari / Android / Desktop)
router.get('/conversations/:id/messages/:messageId/audio', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id, messageId } = req.params;

    const conversation = await findConversation(id);

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

    if (!message || (message.conversationId !== conversation.id && message.conversationId !== id) || !message.mediaUrl) {
      return error(res, 'Audio message not found', 404);
    }

    const fileInfo = storageService.getPrivateFileInfo('voice', message.mediaUrl);
    const totalSize = fileInfo.fileSize;
    const rangeHeader = req.headers.range;

    // Support HTTP 206 Partial Content for Safari iOS and Android seeking
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.setHeader('Content-Range', `bytes */${totalSize}`);
        return res.status(416).send('Requested range not satisfiable');
      }

      const chunksize = end - start + 1;
      const fileStream = storageService.getPrivateFileStream('voice', message.mediaUrl, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': fileInfo.mimeType,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      });

      fileStream.stream.pipe(res);
    } else {
      const fileStream = storageService.getPrivateFileStream('voice', message.mediaUrl);

      res.setHeader('Content-Type', fileStream.mimeType);
      res.setHeader('Content-Length', totalSize);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Accept-Ranges', 'bytes');

      fileStream.stream.pipe(res);
    }
  } catch (err) {
    if (err.statusCode === 404) return error(res, 'Audio file not found in storage', 404);
    return error(res, err.message, 500);
  }
});

// 7. Mark Conversation Read & Synchronize Across Devices
router.post('/conversations/:id/read', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const conversation = await findConversation(id);
    if (!conversation) {
      return error(res, 'Conversation not found', 404);
    }

    if (conversation.match.user1Id !== currentUserId && conversation.match.user2Id !== currentUserId) {
      return error(res, 'Unauthorized', 403);
    }

    const partnerId = conversation.match.user1Id === currentUserId ? conversation.match.user2Id : conversation.match.user1Id;

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Notify partner (read receipt) and reader's other devices (clears unread badge)
    socketService.broadcastMessageRead(conversation.id, currentUserId, partnerId);

    return success(res, null, 'Conversation marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
