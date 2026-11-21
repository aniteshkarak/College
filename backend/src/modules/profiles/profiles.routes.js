import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/authMiddleware.js';
import profileController from './profile.controller.js';

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

// Photo Management Routes
router.post('/photos', requireAuth, upload.single('photo'), profileController.uploadPhoto);
router.delete('/photos/:photoId', requireAuth, profileController.deletePhoto);
router.patch('/photos/:photoId/main', requireAuth, profileController.setMainPhoto);

export default router;
