import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { success } from '../../utils/response.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  return success(
    res,
    {
      notifications: [
        {
          id: 'notif_welcome',
          title: 'Welcome to Collégé!',
          body: 'Your profile is ready. Start discovering new students!',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    'User notifications'
  );
});

export default router;
