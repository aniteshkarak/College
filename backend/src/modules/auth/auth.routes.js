import { Router } from 'express';
import authController from './auth.controller.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/resubmit-verification/:userId', authController.resubmitVerification);
router.get('/me', requireAuth, authController.getMe);

export default router;
