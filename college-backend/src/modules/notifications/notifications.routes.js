import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { notificationsRepo } from '../../services/file.service.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const list = await notificationsRepo.getByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      data: list
    });
  } catch (err) {
    next(err);
  }
});

export default router;
