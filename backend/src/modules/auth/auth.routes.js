import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authController from './auth.controller.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

router.post('/register', authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.post('/change-password', requireAuth, authController.changePassword);
router.post('/refresh', authController.refresh);
router.post('/resubmit-verification/:userId', authController.resubmitVerification);
router.get('/me', requireAuth, authController.getMe);
router.get('/sessions', requireAuth, authController.getSessions);
router.delete('/sessions/:sessionId', requireAuth, authController.revokeSession);

export default router;
