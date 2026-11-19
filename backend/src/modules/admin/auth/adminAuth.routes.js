
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import adminAuthController from './adminAuth.controller.js';

const router = Router();

// Limit repeated administrator login attempts.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 5 : 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many administrator login attempts. Please try again after 15 minutes.',
  },
});

router.post('/login', adminLoginLimiter, adminAuthController.login);

export default router;
