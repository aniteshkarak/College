import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';

import config from './config/env.js';
import passport from './config/passport.js';
import swaggerSpec from './config/swagger.js';
import { getHealthStatus } from './services/healthService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { error } from './utils/response.js';
import { requireActiveAccount } from './middleware/activeAccountGuard.js';

// Import Modular Routes
import registrationRoutes from './modules/registration/registration.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import profilesRoutes from './modules/profiles/profiles.routes.js';
import discoveryRoutes from './modules/discovery/discovery.routes.js';
import matchingRoutes from './modules/matching/matching.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import campusRoutes from './modules/campus/campus.routes.js';
import gamesRoutes from './modules/games/games.routes.js';
import relationshipsRoutes from './modules/relationships/relationships.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI assets
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(passport.initialize());

// Rate Limiting (Applied across all API endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api/', apiLimiter);

// Swagger OpenAPI 3.0 Interactive Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check API (Both /health and /api/v1/health per requirements)
const healthHandler = async (_req, res) => {
  const status = await getHealthStatus();
  const httpCode = status.status === 'UP' ? 200 : 503;
  return res.status(httpCode).json(status);
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Root Welcome Endpoint
app.get('/', (_req, res) => {
  return res.json({
    name: 'Collégé Backend API',
    tagline: 'Meet. Chat. Connect.',
    version: '1.0.0',
    verificationPolicy: '100% Manual Human Verification (Up to 72 Hours)',
    documentation: '/api-docs',
    health: '/api/v1/health',
    status: 'Running',
  });
});

// Registration Workflow Endpoints (Public applicant submission & status check)
app.use('/api/v1/registration', registrationRoutes);

// Authentication Endpoints (Login only for approved active accounts)
app.use('/api/v1/auth', authRoutes);

// User Profile Endpoints
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/profiles', profilesRoutes);

// Protected Community Features (Strictly requires ACTIVE approved account!)
app.use('/api/v1/discovery', requireActiveAccount, discoveryRoutes);
app.use('/api/v1/matching', requireActiveAccount, matchingRoutes);
app.use('/api/v1/chat', requireActiveAccount, chatRoutes);
app.use('/api/v1/campus', requireActiveAccount, campusRoutes);
app.use('/api/v1/games', requireActiveAccount, gamesRoutes);
app.use('/api/v1/relationships', requireActiveAccount, relationshipsRoutes);

// Notifications & Moderation Reports
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/reports', reportsRoutes);

// Admin Application Verification & Moderation Portal
app.use('/api/v1/admin', adminRoutes);

// 404 Route Not Found
app.use((_req, res) => {
  return error(res, 'Requested endpoint not found on Collégé API', 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
