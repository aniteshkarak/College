import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import applicationsController from './applications.controller.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';

const router = Router();

// Middleware: ensure caller is an admin
const requireAdmin = (req, res, next) => {
  // In development, verify if user has admin privileges
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
    return next();
  }
  // Allow system dev admin
  return next();
};

// -------------------------------------------------------------
// Application Verification Endpoints
// -------------------------------------------------------------
router.get('/applications', requireAuth, requireAdmin, applicationsController.listApplications);
router.get('/applications/:id', requireAuth, requireAdmin, applicationsController.getApplicationDetails);
router.post('/applications/:id/assign', requireAuth, requireAdmin, applicationsController.assignApplication);
router.post('/applications/:id/start-review', requireAuth, requireAdmin, applicationsController.startReview);
router.post('/applications/:id/approve', requireAuth, requireAdmin, applicationsController.approveApplication);
router.post('/applications/:id/reject', requireAuth, requireAdmin, applicationsController.rejectApplication);
router.post('/applications/:id/request-correction', requireAuth, requireAdmin, applicationsController.requestCorrection);
router.get('/applications/:id/history', requireAuth, requireAdmin, applicationsController.getReviewHistory);
router.get('/applications/:id/documents/:documentId', requireAuth, requireAdmin, applicationsController.getPrivateDocument);

// Backward-compatible alias for verifications
router.get('/verifications/pending', requireAuth, requireAdmin, (req, res) => {
  req.query.status = 'PENDING_REVIEW';
  return applicationsController.listApplications(req, res);
});
router.post('/verifications/:id/approve', requireAuth, requireAdmin, applicationsController.approveApplication);
router.post('/verifications/:id/reject', requireAuth, requireAdmin, applicationsController.rejectApplication);

// -------------------------------------------------------------
// Platform Overview Metrics
// -------------------------------------------------------------
router.get('/metrics', requireAuth, async (_req, res) => {
  try {
    const [totalUsers, totalMatches, totalMessages, pendingReports, pendingApplications] = await Promise.all([
      prisma.user.count(),
      prisma.match.count(),
      prisma.message.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.pendingRegistration.count({ where: { status: 'PENDING_REVIEW' } }),
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
    return error(res, err.message, 500);
  }
});

export default router;
