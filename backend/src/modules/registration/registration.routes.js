import { Router } from 'express';
import registrationController from './registration.controller.js';

const router = Router();

// Registration workflow endpoints
router.post('/start', registrationController.startRegistration);
router.post('/submit', registrationController.submitRegistration);
router.get('/status', registrationController.getStatus);
router.get('/application', registrationController.getApplicationDetails);
router.post('/resubmit', registrationController.resubmit);
router.get('/colleges', registrationController.getColleges);
router.post('/colleges/request', registrationController.requestCollege);
router.post('/upload', registrationController.uploadPrivateFile);

export default router;
