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
import {
  getHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
  getDatabaseHealth,
  getRedisHealth,
} from './services/healthService.js';
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
import { STORAGE_PATHS } from './config/storage.js';

const app = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI assets
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows image loading across ports/origins
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman)
      if (!origin) return callback(null, true);
      // Allow any localhost / 127.0.0.1 port in development
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (config.corsOrigins && config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(passport.initialize());

// Root Welcome Endpoint (Unrestricted)
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

// Comprehensive Health & Diagnostics Endpoints (Exempt from rate limiting)
const healthHandler = async (_req, res) => {
  const status = await getHealthStatus();
  const httpCode = status.status === 'UP' ? 200 : 503;
  return res.status(httpCode).json(status);
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Liveness endpoint (Checks if Node.js server process is responding)
app.get('/api/v1/health/live', (_req, res) => {
  return res.status(200).json(getLivenessStatus());
});

// Readiness endpoint (Checks if DB is ready to serve queries)
app.get('/api/v1/health/ready', async (_req, res) => {
  const status = await getReadinessStatus();
  const httpCode = status.status === 'READY' ? 200 : 503;
  return res.status(httpCode).json(status);
});

// Component-specific diagnostic checks
app.get('/api/v1/health/db', async (_req, res) => {
  const status = await getDatabaseHealth();
  const httpCode = status.status === 'HEALTHY' ? 200 : 503;
  return res.status(httpCode).json(status);
});

app.get('/api/v1/health/redis', async (_req, res) => {
  const status = await getRedisHealth();
  const httpCode = status.status === 'HEALTHY' ? 200 : 503;
  return res.status(httpCode).json(status);
});

// Swagger OpenAPI 3.0 Interactive Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rate Limiting (Applied across student & general API endpoints, not health checks)
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

// Public Static File Serving for Approved Profile Photos & Thumbnails
const staticPhotoHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400');
};

app.use('/api/v1/photos', express.static(STORAGE_PATHS.PHOTOS_DIR, { setHeaders: staticPhotoHeaders }));
app.use('/api/v1/thumbnails', express.static(STORAGE_PATHS.THUMBNAILS_DIR, { setHeaders: staticPhotoHeaders }));
app.use('/api/v1/discovery-photos', express.static(STORAGE_PATHS.DISCOVERY_DIR, { setHeaders: staticPhotoHeaders }));

// Fallback image placeholder if requested photo is missing on disk (prevents broken image icons)
const placeholderSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#0f172a"/>
    <circle cx="300" cy="240" r="100" fill="#e11d48" opacity="0.85"/>
    <path d="M150 490 C150 380 450 380 450 490 Z" fill="#e11d48" opacity="0.85"/>
    <text x="300" y="545" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">Collégé Student</text>
  </svg>`
);
app.use(['/api/v1/photos', '/api/v1/thumbnails', '/api/v1/discovery-photos'], (_req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(placeholderSvg);
});

// 404 Route Not Found
app.use((_req, res) => {
  return error(res, 'Requested endpoint not found on Collégé API', 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
