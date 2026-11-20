
import { Router } from 'express';
import applicationsController from './applications.controller.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import socketService from '../../services/socketService.js';

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
      if (err.message && (err.message.includes('Can\'t reach database server') || err.message.includes('PrismaClient'))) {
        return success(res, {
          metrics: {
            totalUsers: 0,
            totalMatches: 0,
            totalMessages: 0,
            pendingReports: 0,
            pendingApplications: 0,
            targetHours: 72,
            platformUptime: Math.floor(process.uptime()),
          },
        });
      }
      return error(res, 'Unable to retrieve platform metrics.', 500);
    }
  }
);

// Safety & Moderation Reports: Super Admin and Support Admin
const requireSupportOrSuperAdmin = requireAdminRoles('SUPER_ADMIN', 'SUPPORT_ADMIN');

router.get('/reports', requireAdminAuth, requireSupportOrSuperAdmin, async (req, res) => {
  try {
    const { status = 'PENDING' } = req.query;
    const where = {};
    if (status !== 'ALL') {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            fullName: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            displayName: true,
            fullName: true,
            email: true,
            accountStatus: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, { reports }, 'Reports retrieved successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/reports/:id/resolve', requireAdminAuth, requireSupportOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body || {};

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return error(res, 'Report not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.report.update({
        where: { id },
        data: { status: 'RESOLVED' },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          action: 'RESOLVE_REPORT',
          targetType: 'REPORT',
          targetId: id,
          details: JSON.stringify({
            previousStatus: report.status,
            newStatus: 'RESOLVED',
            resolutionNotes: resolutionNotes || null,
          }),
          ipAddress: req.ip || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return r;
    });

    return success(res, { report: updated }, 'Report resolved successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/reports/:id/dismiss', requireAdminAuth, requireSupportOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { dismissReason } = req.body || {};

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return error(res, 'Report not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.report.update({
        where: { id },
        data: { status: 'DISMISSED' },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          action: 'DISMISS_REPORT',
          targetType: 'REPORT',
          targetId: id,
          details: JSON.stringify({
            previousStatus: report.status,
            newStatus: 'DISMISSED',
            dismissReason: dismissReason || null,
          }),
          ipAddress: req.ip || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return r;
    });

    return success(res, { report: updated }, 'Report dismissed successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// User Account Moderation: Suspend / Activate
router.post('/users/:id/suspend', requireAdminAuth, requireSupportOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: { accountStatus: 'SUSPENDED' },
        select: { id: true, displayName: true, email: true, accountStatus: true },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          action: 'SUSPEND_USER',
          targetType: 'USER',
          targetId: id,
          details: JSON.stringify({ reason: reason || 'Violation of community safety policies' }),
          ipAddress: req.ip || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return u;
    });

    // Invalidate and terminate all active socket connections for suspended user
    socketService.disconnectUserSockets(id);

    return success(res, { user: updated }, 'User account has been suspended');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/users/:id/activate', requireAdminAuth, requireSupportOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: { accountStatus: 'ACTIVE' },
        select: { id: true, displayName: true, email: true, accountStatus: true },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          action: 'ACTIVATE_USER',
          targetType: 'USER',
          targetId: id,
          details: JSON.stringify({ reason: reason || 'Account reinstated by administrator' }),
          ipAddress: req.ip || null,
          userAgent: req.get('user-agent') || null,
        },
      });

      return u;
    });

    return success(res, { user: updated }, 'User account has been reactivated');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Admin User Listing
router.get('/users', requireAdminAuth, requireSupportOrSuperAdmin, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (status) {
      where.accountStatus = status;
    }
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          fullName: true,
          email: true,
          mobileNumber: true,
          age: true,
          gender: true,
          accountStatus: true,
          verificationStatus: true,
          subscriptionPlan: true,
          createdAt: true,
          education: {
            select: {
              collegeName: true,
              degreeName: true,
              departmentStream: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Admin Audit Logs: Super Admin only
router.get('/audit-logs', requireAdminAuth, requireAdminRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const take = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));

    const logs = await prisma.adminAuditLog.findMany({
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
            roleName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return success(res, { auditLogs: logs }, 'Audit logs retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Admin Moderation of Campus Announcements
router.post(
  '/announcements/:id/moderate',
  requireAdminAuth,
  requireSupportOrSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action = 'DELETE', reason = '' } = req.body || {};

      const existing = await prisma.campusAnnouncement.findUnique({
        where: { id },
      });
      if (!existing) {
        return error(res, 'Announcement not found', 404);
      }

      const newCategory = action === 'RESTORE' ? 'General' : 'DELETED';
      const updated = await prisma.$transaction(async (tx) => {
        const a = await tx.campusAnnouncement.update({
          where: { id },
          data: { category: newCategory },
        });

        await tx.adminAuditLog.create({
          data: {
            adminId: req.admin.id,
            action: `MODERATE_ANNOUNCEMENT_${action}`,
            targetType: 'ANNOUNCEMENT',
            targetId: id,
            details: JSON.stringify({
              previousCategory: existing.category,
              newCategory,
              action,
              reason: reason || 'Administrative content moderation',
            }),
            ipAddress: req.ip || null,
            userAgent: req.get('user-agent') || null,
          },
        });

        return a;
      });

      return success(res, { announcement: updated }, `Announcement moderated (${action})`);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }
);

export default router;
