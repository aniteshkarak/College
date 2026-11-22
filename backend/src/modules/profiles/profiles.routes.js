import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/authMiddleware.js';
import profileController from './profile.controller.js';
import { handleMoodUpdate } from '../users/users.routes.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Profile Information Routes
router.get('/me', requireAuth, profileController.getMyProfile);
router.get('/', requireAuth, profileController.getMyProfile);
router.put('/me', requireAuth, profileController.updateMyProfile);
router.put('/profile', requireAuth, profileController.updateMyProfile);
router.put('/', requireAuth, profileController.updateMyProfile);

// Mood Management Routes (supports PUT & PATCH /api/v1/profiles/mood & /api/v1/profiles/profile/mood)
router.patch('/profile/mood', requireAuth, handleMoodUpdate);
router.put('/profile/mood', requireAuth, handleMoodUpdate);
router.patch('/mood', requireAuth, handleMoodUpdate);
router.put('/mood', requireAuth, handleMoodUpdate);

// Photo Management Routes
router.post('/photos', requireAuth, upload.single('photo'), profileController.uploadPhoto);
router.delete('/photos/:photoId', requireAuth, profileController.deletePhoto);
router.patch('/photos/:photoId/main', requireAuth, profileController.setMainPhoto);

export default router;
