import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { env } from './config/environment.js';
import { corsOptions } from './config/cors.js';
import { initStorage } from './services/file.service.js';
import { setupChatSocket } from './modules/chat/chat.socket.js';

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Attach Socket.IO for real-time messaging
const io = new SocketIOServer(server, {
  cors: corsOptions
});

// Setup chat socket handlers
setupChatSocket(io);

// Initialize storage and launch server
const startServer = async () => {
  try {
    // 1. Ensure JSON database files & directories exist
    await initStorage();
    console.log('[STORAGE] Safe JSON atomic file engine initialized successfully.');

    // 2. Start HTTP & Socket server
    server.listen(env.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🎓 Collégé Backend Server Running`);
      console.log(`🌐 Server URL: http://localhost:${env.PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${env.PORT}/api-docs`);
      console.log(`❤️  Health Check: http://localhost:${env.PORT}/api/v1/health`);
      console.log(`🔒 Mode: Zero-Database JSON Atomic Storage Engine`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('[FATAL] Failed to initialize Collégé backend:', err);
    process.exit(1);
  }
};

// Handle process termination gracefully
const shutdown = () => {
  console.log('\n[SERVER] Gracefully shutting down Collégé backend...');
  server.close(() => {
    console.log('[SERVER] Server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Execute startup if run directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { server, io };
