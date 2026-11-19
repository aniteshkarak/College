import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { applicationsRepo } from '../../services/file.service.js';

const router = Router();

router.use(authenticate);

router.get('/check', async (req, res, next) => {
  try {
    const user = req.user;
    const application = user.application_id ? await applicationsRepo.getByAppId(user.application_id) : null;

    return res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        verificationStatus: user.verification_status,
        accountStatus: user.account_status,
        applicationId: user.application_id || null,
        collegeName: user.college_name,
        application
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
