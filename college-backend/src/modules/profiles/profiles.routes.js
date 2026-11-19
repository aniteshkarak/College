import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { usersRepo } from '../../services/file.service.js';

const router = Router();

router.use(authenticate);

router.get('/me', (req, res) => {
  const { password_hash, ...safe } = req.user;
  return res.status(200).json({
    success: true,
    data: safe
  });
});

router.patch('/me', async (req, res, next) => {
  try {
    const allowed = ['display_name', 'bio', 'interests', 'hobbies', 'mood', 'looking_for'];
    const patch = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        patch[key] = req.body[key];
      }
    }

    const updated = await usersRepo.update(req.user.id, patch);
    const { password_hash, ...safe } = updated;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: safe
    });
  } catch (err) {
    next(err);
  }
});

export default router;
