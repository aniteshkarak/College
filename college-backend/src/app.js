import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { corsOptions } from './config/cors.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Route modules
import registrationRoutes from './modules/registration/registration.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import profilesRoutes from './modules/profiles/profiles.routes.js';
import verificationRoutes from './modules/verification/verification.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';

const app = express();

// 1. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI assets in dev
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS
app.use(cors(corsOptions));

// 3. Body Parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// 4. Structured HTTP Logging (Pino)
if (process.env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { colorize: true }
            }
          : undefined
    })
  );
}

// 5. Global Rate Limiting
app.use(apiRateLimiter);

// 6. Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 7. Health Check API
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    app: 'Collégé Backend',
    mode: 'JSON Atomic Persistence Engine (No Database Required)',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Welcome to Collégé Backend API',
    documentation: '/api-docs',
    health: '/api/v1/health'
  });
});

// 8. Mount Modular Routes
app.use('/api/v1/registration', registrationRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/profiles', profilesRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/chat', chatRoutes);

// 9. 404 Route Handler
app.use('*', (req, res) => {
  return res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `API endpoint ${req.originalUrl} not found on this server.`
  });
});

// 10. Centralized Error Handler
app.use(errorHandler);

export default app;
