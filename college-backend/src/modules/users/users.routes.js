import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { usersRepo } from '../../services/file.service.js';

const router = Router();

// Protected: Only ACTIVE approved users can browse community members
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const users = await usersRepo.getAll();
    const activeVerified = users
      .filter((u) => u.account_status === 'ACTIVE' && u.id !== req.user.id)
      .map(({ password_hash, ...safe }) => safe);

    return res.status(200).json({
      success: true,
      data: activeVerified
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await usersRepo.getById(req.params.id);
    if (!user || user.account_status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Verified member profile not found.'
      });
    }

    const { password_hash, ...safe } = user;
    return res.status(200).json({
      success: true,
      data: safe
    });
  } catch (err) {
    next(err);
  }
});

export default router;
