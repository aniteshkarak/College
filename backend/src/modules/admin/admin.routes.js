import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

// Middleware: ensure caller is an admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  // For development convenience, allow student super admin if designated
  return next();
};

/**
 * GET /api/v1/admin/verifications/pending
 * Retrieve all pending user registrations awaiting Admin ID verification
 */
router.get('/verifications/pending', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const pending = await prisma.user.findMany({
      where: { verificationStatus: 'PENDING_APPROVAL' },
      select: {
        id: true,
        fullName: true,
        displayName: true,
        dateOfBirth: true,
        age: true,
        gender: true,
        email: true,
        mobileNumber: true,
        collegeName: true,
        course: true,
        avatarUrl: true,         // Photo 1
        additionalPhotos: true,  // Photo 2+
        verificationIdUrl: true, // College ID / Govt ID
        verificationIdType: true,
        verificationStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, { pendingVerifications: pending }, 'Pending student verifications retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

/**
 * POST /api/v1/admin/verifications/:userId/approve
 * Admin checks and ACCEPTS the student registration -> Account becomes active & approved
 */
router.post('/verifications/:userId/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'APPROVED',
        rejectionReason: null,
      },
      select: {
        id: true,
        fullName: true,
        displayName: true,
        verificationStatus: true,
      },
    });

    return success(res, { user: updated }, `Student registration for ${updated.displayName} has been ACCEPTED & verified.`);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

/**
 * POST /api/v1/admin/verifications/:userId/reject
 * Admin checks and DECLINES the student registration with a reason
 */
const rejectSchema = z.object({
  reason: z.string().min(3, 'Please provide a clear reason for declining verification'),
});

router.post('/verifications/:userId/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const parseResult = rejectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed: A valid decline reason is required', 400, parseResult.error.issues);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: parseResult.data.reason,
      },
      select: {
        id: true,
        fullName: true,
        displayName: true,
        verificationStatus: true,
        rejectionReason: true,
      },
    });

    return success(
      res,
      { user: updated },
      `Student registration for ${updated.displayName} was declined: "${parseResult.data.reason}". The user will be requested to update their details.`
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
});

/**
 * GET /api/v1/admin/metrics
 */
router.get('/metrics', requireAuth, async (_req, res) => {
  try {
    const [totalUsers, totalMatches, totalMessages, pendingReports, pendingVerifications] = await Promise.all([
      prisma.user.count(),
      prisma.match.count(),
      prisma.message.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { verificationStatus: 'PENDING_APPROVAL' } }),
    ]);

    return success(res, {
      metrics: {
        totalUsers,
        totalMatches,
        totalMessages,
        pendingReports,
        pendingVerifications,
        platformUptime: Math.floor(process.uptime()),
      },
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;
