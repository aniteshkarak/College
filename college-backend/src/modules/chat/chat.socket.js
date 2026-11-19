import { verifyToken } from '../../utils/token.js';
import { usersRepo } from '../../services/file.service.js';

export const setupChatSocket = (io) => {
  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required for real-time chat'));
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid socket session token'));
      }

      const user = await usersRepo.getById(decoded.userId);
      if (!user || user.account_status !== 'ACTIVE') {
        return next(new Error('Only verified, approved campus students may connect to chat'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[SOCKET] User connected: ${user.display_name} (${user.id})`);

    // Join personal room for notifications
    socket.join(`user:${user.id}`);

    // Join conversation room
    socket.on('join_thread', ({ matchId }) => {
      socket.join(`thread:${matchId}`);
    });

    // Real-time message exchange
    socket.on('send_message', (data) => {
      const { matchId, message } = data;
      const messagePayload = {
        id: `msg_${Date.now()}`,
        matchId,
        senderId: user.id,
        senderName: user.display_name,
        senderAvatar: user.avatar_url,
        content: message.content,
        messageType: message.messageType || 'text',
        createdAt: new Date().toISOString()
      };

      io.to(`thread:${matchId}`).emit('new_message', messagePayload);
    });

    // Typing indicator
    socket.on('typing', ({ matchId, isTyping }) => {
      socket.to(`thread:${matchId}`).emit('user_typing', {
        userId: user.id,
        displayName: user.display_name,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] User disconnected: ${user.display_name}`);
    });
  });
};
