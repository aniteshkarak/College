
import { Router } from 'express';
import applicationsController from './applications.controller.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';

import adminAuthRoutes from './auth/adminAuth.routes.js';
import {
  requireAdminAuth,
  requireAdminRoles,
} from './auth/adminAuth.middleware.js';

const router = Router();

// Public administrator login.
// This route must be registered before protected routes.
router.use('/auth', adminAuthRoutes);

// Only Super Admin and Verification Admin can review applications.
const requireVerificationAdmin = requireAdminRoles(
  'SUPER_ADMIN',
  'VERIFICATION_ADMIN'
);

// Application verification endpoints.
router.get(
  '/applications',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.listApplications
);

router.get(
  '/applications/:id',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.getApplicationDetails
);

router.post(
  '/applications/:id/assign',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.assignApplication
);

router.post(
  '/applications/:id/start-review',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.startReview
);

router.post(
  '/applications/:id/approve',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.approveApplication
);

router.post(
  '/applications/:id/reject',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.rejectApplication
);

router.post(
  '/applications/:id/request-correction',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.requestCorrection
);

router.get(
  '/applications/:id/history',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.getReviewHistory
);

router.get(
  '/applications/:id/documents/:documentId',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.getPrivateDocument
);

router.get(
  '/applications/:id/photos/:photoId',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.getPrivatePhoto
);

// Backward-compatible verification routes.
router.get(
  '/verifications/pending',
  requireAdminAuth,
  requireVerificationAdmin,
  (req, res) => {
    req.query.status = 'PENDING_REVIEW';
    return applicationsController.listApplications(req, res);
  }
);

router.post(
  '/verifications/:id/approve',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.approveApplication
);

router.post(
  '/verifications/:id/reject',
  requireAdminAuth,
  requireVerificationAdmin,
  applicationsController.rejectApplication
);

// Platform metrics: Super Admin only.
router.get(
  '/metrics',
  requireAdminAuth,
  requireAdminRoles('SUPER_ADMIN'),
  async (_req, res) => {
    try {
      const [
        totalUsers,
        totalMatches,
        totalMessages,
        pendingReports,
        pendingApplications,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.match.count(),
        prisma.message.count(),
        prisma.report.count({ where: { status: 'PENDING' } }),
        prisma.pendingRegistration.count({
          where: { status: 'PENDING_REVIEW' },
        }),
      ]);

      return success(res, {
        metrics: {
          totalUsers,
          totalMatches,
          totalMessages,
          pendingReports,
          pendingApplications,
          targetHours: 72,
          platformUptime: Math.floor(process.uptime()),
        },
      });
    } catch (err) {
      return error(res, 'Unable to retrieve platform metrics.', 500);
    }
  }
);

export default router;
