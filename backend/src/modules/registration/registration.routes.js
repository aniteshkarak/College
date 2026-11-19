import { Router } from 'express';
import * as registrationController from './registration.controller.js';
import { registrationUpload } from '../../middleware/uploadMiddleware.js';

const router = Router();

// Registration workflow endpoints
router.post('/start', registrationController.startRegistration);
router.post('/submit', registrationUpload, registrationController.submitRegistration);

// Status inquiries
router.get('/status/:applicationId', registrationController.getStatus);
router.get('/status', registrationController.getStatus);
router.get('/application/:applicationId', registrationController.getApplicationDetails);
router.get('/application', registrationController.getApplicationDetails);

// Correction resubmissions
router.post('/resubmit/:applicationId', registrationUpload, registrationController.resubmit);
router.post('/resubmit', registrationUpload, registrationController.resubmit);
router.put('/update/:applicationId', registrationUpload, registrationController.resubmit);

// Colleges directory
router.get('/colleges', registrationController.getColleges);
router.post('/colleges/request', registrationController.requestCollege);

export default router;
