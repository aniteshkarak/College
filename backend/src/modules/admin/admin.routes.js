
import { Router } from 'express';
import applicationsController from './applications.controller.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import socketService from '../../services/socketService.js';
import notificationService, { NOTIFICATION_TYPES } from '../../services/notificationService.js';

import adminAuthRoutes from './auth/adminAuth.routes.js';
import {
  requireAdminAuth,
  requireAdminRoles,
} from './auth/adminAuth.middleware.js';

import analyticsService from '../../services/analyticsService.js';
import incidentService from '../../services/incidentService.js';
import alertService from '../../services/alertService.js';
import healthService from '../../services/healthService.js';

const router = Router();

// Public administrator login.
// This route must be registered before protected routes.
router.use('/auth', adminAuthRoutes);

// Super Admin, Admin and Verification Admin can review applications.
const requireVerificationAdmin = requireAdminRoles(
  'SUPER_ADMIN',
  'ADMIN',
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

// Platform metrics: Super Admin & Admin.
router.get(
  '/metrics',
  requireAdminAuth,
  requireAdminRoles('SUPER_ADMIN', 'ADMIN'),
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

// Safety & Moderation Reports: Super Admin, Admin and Support Admin
const requireSupportOrSuperAdmin = requireAdminRoles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN');

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

    if (report.reporterId) {
      notificationService.createNotification({
        recipientId: report.reporterId,
        actorId: null,
        type: NOTIFICATION_TYPES.REPORT_UPDATE,
        title: 'Report Update',
        message: `Your report status has been updated: Resolved (${resolutionNotes || 'Action taken.'})`,
        relatedEntityId: report.id,
        data: { reportId: report.id, status: 'RESOLVED' },
      }).catch(() => {});
    }

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

    if (report.reporterId) {
      notificationService.createNotification({
        recipientId: report.reporterId,
        actorId: null,
        type: NOTIFICATION_TYPES.REPORT_UPDATE,
        title: 'Report Update',
        message: `Your report status has been updated: Dismissed (${dismissReason || 'Reviewed and dismissed.'})`,
        relatedEntityId: report.id,
        data: { reportId: report.id, status: 'DISMISSED' },
      }).catch(() => {});
    }

    return success(res, { report: updated }, 'Report dismissed successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Broadcast Admin Notice to students
router.post('/broadcast-notice', requireAdminAuth, requireAdminRoles('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { title, message, targetCollege } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return error(res, 'Title is required (string, max 200 characters)', 400);
    }
    if (!message || typeof message !== 'string' || !message.trim() || message.trim().length > 2000) {
      return error(res, 'Message is required (string, max 2000 characters)', 400);
    }

    const where = { accountStatus: 'ACTIVE' };
    if (targetCollege && typeof targetCollege === 'string' && targetCollege.trim()) {
      where.education = { collegeName: { equals: targetCollege.trim(), mode: 'insensitive' } };
    }

    const recipients = await prisma.user.findMany({
      where,
      select: { id: true },
      take: 1000,
    });

    // Asynchronously dispatch notifications in background chunks so main thread isn't blocked
    setImmediate(async () => {
      const CHUNK_SIZE = 25;
      for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
        const chunk = recipients.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map((r) =>
            notificationService.createNotification({
              recipientId: r.id,
              actorId: null,
              type: NOTIFICATION_TYPES.ADMIN_NOTICE,
              title: title.trim(),
              message: message.trim(),
              data: { broadcastBy: req.admin.id },
            }).catch(() => {})
          )
        );
      }
    });

    return success(res, { recipientCount: recipients.length }, 'Admin notice broadcast successfully');
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

// =============================================================
// PRODUCTION MONITORING, ANALYTICS & INCIDENT MANAGEMENT APIS
// =============================================================

const requireAdminManager = requireAdminRoles('SUPER_ADMIN', 'ADMIN');

// 1. Product Analytics Overview (Real DB metrics)
router.get(
  '/analytics/overview',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const stats = await analyticsService.getOverviewStats();
      return success(res, stats, 'Platform analytics overview retrieved');
    } catch (err) {
      return error(res, err.message, 500);
    }
  }
);

// 2. Product Analytics Time-Series Trends (7d, 30d, 90d, custom)
router.get(
  '/analytics/trends',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const { range = '7d', startDate, endDate } = req.query;
      const trends = await analyticsService.getProductTrends({ range, startDate, endDate });
      return success(res, trends, 'Product analytics trends retrieved');
    } catch (err) {
      return error(res, err.message, 500);
    }
  }
);

// 3. System Health Overview (SRE view: API, DB, Redis, Storage, OS metrics)
router.get(
  '/monitoring/health',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const health = await healthService.getHealthStatus();
      return success(res, health, 'System health diagnostics retrieved');
    } catch (err) {
      return error(res, err.message, 500);
    }
  }
);

// 4. Live System Alerts & Rules Evaluation
router.get(
  '/monitoring/alerts',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const alertsData = await alertService.evaluateSystemAlerts();
      return success(res, alertsData, 'System alert rules evaluated');
    } catch (err) {
      return error(res, err.message, 500);
    }
  }
);

// 5. Structured Error Logs Listing
router.get(
  '/monitoring/errors',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const { severity, component, page, limit } = req.query;
      const logsData = await incidentService.listErrorLogs({ severity, component, page, limit });
      return success(res, logsData, 'System error logs retrieved');
    } catch (err) {
      return error(res, err.message, 500);
    }
  }
);

// 6. List Incidents
router.get(
  '/incidents',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const { status, severity, page, limit } = req.query;
      const incidentsData = await incidentService.listIncidents({ status, severity, page, limit });
      return success(res, incidentsData, 'System incidents retrieved');
    } catch (err) {
      return error(res, err.message, 500);
    }
  }
);

// 7. Get Incident Details
router.get(
  '/incidents/:id',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const incident = await incidentService.getIncidentDetails(req.params.id);
      return success(res, { incident }, 'Incident details retrieved');
    } catch (err) {
      return error(res, err.message, err.statusCode || 500);
    }
  }
);

// 8. Update Incident Status
router.patch(
  '/incidents/:id/status',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const { status, notes } = req.body || {};
      if (!status) {
        return error(res, 'New status is required', 400);
      }
      const updated = await incidentService.updateIncidentStatus(req.params.id, {
        status,
        notes,
        adminId: req.admin.id,
        adminName: req.admin.fullName,
      });
      return success(res, { incident: updated }, `Incident status updated to ${status}`);
    } catch (err) {
      return error(res, err.message, err.statusCode || 500);
    }
  }
);

// 9. Resolve Incident
router.post(
  '/incidents/:id/resolve',
  requireAdminAuth,
  requireAdminManager,
  async (req, res) => {
    try {
      const { resolutionNotes } = req.body || {};
      const resolved = await incidentService.resolveIncident(req.params.id, {
        resolutionNotes,
        adminId: req.admin.id,
        adminName: req.admin.fullName,
      });
      return success(res, { incident: resolved }, 'Incident marked as RESOLVED');
    } catch (err) {
      return error(res, err.message, err.statusCode || 500);
    }
  }
);

export default router;
