import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireVerificationAdmin } from '../../middleware/authorizeAdmin.js';

const router = Router();

// All admin routes require authentication and VERIFICATION_ADMIN or SUPER_ADMIN role
router.use(authenticate, requireVerificationAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/applications', adminController.listApplications);
router.get('/applications/:id', adminController.getApplicationDetails);
router.post('/applications/:id/start-review', adminController.claimApplication);
router.post('/applications/:id/approve', adminController.approveApplication);
router.post('/applications/:id/reject', adminController.rejectApplication);
router.post('/applications/:id/request-correction', adminController.requestCorrection);

// Streaming private documents/photos strictly to authenticated admins
router.get('/documents/:subfolder/:filename', adminController.streamDocument);

export default router;
