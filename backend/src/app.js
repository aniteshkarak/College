import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env.js';
import passport from './config/passport.js';
import { getHealthStatus } from './services/healthService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { error } from './utils/response.js';

// Import Modular Routes
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
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

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
    documentation: '/api/v1/health',
    status: 'Running',
  });
});

// Mount Module APIs under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/profiles', profilesRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/matching', matchingRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/campus', campusRoutes);
app.use('/api/v1/games', gamesRoutes);
app.use('/api/v1/relationships', relationshipsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 Route Not Found
app.use((_req, res) => {
  return error(res, 'Requested endpoint not found on Collégé API', 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
