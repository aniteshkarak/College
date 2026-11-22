import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { serializePublicProfile, serializePrivateAccount } from '../../utils/serializers.js';
import { success, error } from '../../utils/response.js';
import profileController from '../profiles/profile.controller.js';
import socketService from '../../services/socketService.js';
import { z } from 'zod';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Profile Management Endpoints (Supports PUT /api/v1/users/profile)
router.get('/profile', requireAuth, profileController.getMyProfile);
router.put('/profile', requireAuth, profileController.updateMyProfile);

// Photo Management Endpoints
router.post('/photos', requireAuth, upload.single('photo'), profileController.uploadPhoto);
router.delete('/photos/:photoId', requireAuth, profileController.deletePhoto);
router.patch('/photos/:photoId/main', requireAuth, profileController.setMainPhoto);

export const SUPPORTED_MOODS = [
  { id: 'happy', label: 'Happy & Vibe', emoji: '✨' },
  { id: 'sad', label: 'Feeling Sad', emoji: '🥺' },
  { id: 'feeling_bad', label: 'Feeling Bad / Low', emoji: '🌧️' },
  { id: 'bored', label: 'Bored', emoji: '🥱' },
  { id: 'lonely', label: 'Feeling Lonely', emoji: '🫂' },
  { id: 'stressed', label: 'Stressed / Overwhelmed', emoji: '🤯' },
  { id: 'romantic', label: 'Feeling Romantic', emoji: '🌹' },
  { id: 'dating', label: 'Open to Dating', emoji: '💫' },
  { id: 'friends', label: 'Want to make friends', emoji: '🤝' },
  { id: 'chat', label: 'Looking for a conversation', emoji: '💬' },
  { id: 'chill', label: 'Chilling & Relaxed', emoji: '☕' },
  { id: 'excited', label: 'Excited & Hyped', emoji: '🎉' },
  { id: 'studying', label: 'In Study Mode', emoji: '📚' },
  { id: 'heartbroken', label: 'Heartbroken', emoji: '💔' },
  { id: 'playful', label: 'Playful & Fun', emoji: '😜' }
];

export const validateMood = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim().toLowerCase();
  const found = SUPPORTED_MOODS.find(
    (m) => m.id.toLowerCase() === clean || m.label.toLowerCase() === clean
  );
  return found || null;
};

const moodSchema = z.object({
  mood: z.string().min(1).max(100).optional(),
  currentMood: z.string().min(1).max(100).optional(),
  current_mood: z.string().min(1).max(100).optional(),
}).refine((data) => data.mood || data.currentMood || data.current_mood, {
  message: 'Mood cannot be empty',
});

export const handleMoodUpdate = async (req, res) => {
  try {
    const parsed = moodSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed: Please provide a valid mood status.', 400, parsed.error.issues);
    }

    const rawMood = parsed.data.mood || parsed.data.currentMood || parsed.data.current_mood;
    const validatedMood = validateMood(rawMood);
    if (!validatedMood) {
      return error(
        res,
        `Validation failed: Unsupported mood "${rawMood}". Supported moods are: ${SUPPORTED_MOODS.map((m) => m.label).join(', ')}`,
        400,
        { supportedMoods: SUPPORTED_MOODS.map((m) => m.label) }
      );
    }

    const now = new Date();

    const updated = await prisma.userProfile.upsert({
      where: { userId: req.user.id },
      update: {
        currentMood: validatedMood.label,
        moodUpdatedAt: now,
      },
      create: {
        userId: req.user.id,
        currentMood: validatedMood.label,
        moodUpdatedAt: now,
        bio: '',
        city: 'Campus',
        state: 'State',
      },
      select: {
        currentMood: true,
        moodUpdatedAt: true,
        updatedAt: true,
      },
    });

    // Broadcast real-time mood update to all connected users
    socketService.broadcastMoodUpdate(req.user.id, updated.currentMood, updated.moodUpdatedAt);

    return success(
      res,
      {
        currentMood: updated.currentMood,
        mood: updated.currentMood,
        moodUpdatedAt: updated.moodUpdatedAt,
        updatedAt: updated.updatedAt,
      },
      'Mood updated successfully in database'
    );
  } catch (err) {
    return error(res, `Failed to update mood: ${err.message}`, 500);
  }
};

router.patch('/profile/mood', requireAuth, handleMoodUpdate);
router.put('/profile/mood', requireAuth, handleMoodUpdate);
router.patch('/mood', requireAuth, handleMoodUpdate);
router.put('/mood', requireAuth, handleMoodUpdate);

/**
 * GET /api/v1/users/:id
 * Retrieves user profile with strict privacy enforcement:
 * - Account owner receives full private account details (email, mobile, legal name)
 * - Other students receive strictly sanitized public profile (no email, mobile, or identity docs)
 * - Blocked, unapproved, or suspended profiles are inaccessible
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const targetId = req.params.id === 'me' ? req.user.id : req.params.id;
    const isSelf = req.user.id === targetId;

    // Check two-way blocking if viewing another user
    if (!isSelf) {
      const blockExists = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: req.user.id, blockedId: targetId },
            { blockerId: targetId, blockedId: req.user.id },
          ],
        },
      });

      if (blockExists) {
        return error(res, 'User profile is not available.', 404);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        profile: true,
        education: { include: { college: true } },
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    // Hide unapproved or suspended profiles from other students
    if (!isSelf && (user.accountStatus !== 'ACTIVE' || user.verificationStatus !== 'APPROVED')) {
      return error(res, 'User profile is not available.', 404);
    }

    if (isSelf) {
      const privateData = serializePrivateAccount(user);
      return success(res, { user: privateData, profile: privateData }, 'Current user profile retrieved');
    }

    // Return sanitized public profile
    const publicData = serializePublicProfile(user, {
      currentCollegeId: req.user.education?.collegeId,
      currentCollegeName: req.user.education?.collegeName || req.user.collegeName,
    });

    return success(res, { user: publicData, profile: publicData }, 'User public profile retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
