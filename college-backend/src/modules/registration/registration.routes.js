import { Router } from 'express';
import { registrationController } from './registration.controller.js';
import { registrationUpload } from '../../middleware/uploadValidation.js';
import { registrationLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Public registration endpoints
router.post('/submit', registrationLimiter, registrationUpload, registrationController.submit);
router.get('/status/:applicationId', registrationController.getStatus);
router.get('/application/:applicationId', registrationController.getApplication);
router.put('/update/:applicationId', registrationUpload, registrationController.update);
router.post('/resubmit/:applicationId', registrationUpload, registrationController.resubmit);

export default router;
