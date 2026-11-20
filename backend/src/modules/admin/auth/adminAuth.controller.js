
import { z } from 'zod';
import adminAuthService from './adminAuth.service.js';
import prisma from '../../../config/prisma.js';
import { success, error } from '../../../utils/response.js';

const adminLoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export const login = async (req, res) => {
  try {
    const parsed = adminLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      return error(res, 'Please provide a valid email and password.', 400);
    }

    const result = await adminAuthService.loginAdmin(
      parsed.data.email,
      parsed.data.password
    );

    // Record administrator login audit trail asynchronously (fire-and-forget so DB delays don't slow down login)
    prisma.adminAuditLog.create({
      data: {
        adminId: result.admin.id,
        action: 'LOGIN',
        targetType: 'ADMIN',
        targetId: result.admin.id,
        details: `Administrator ${result.admin.fullName} (${result.admin.roleName}) logged in successfully.`,
        ipAddress: req.ip || req.socket?.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
      },
    }).catch((auditErr) => {
      // Non-blocking background log
    });

    return success(res, result, result.message);
  } catch (err) {
    if (err.message === 'Invalid administrator credentials.') {
      return error(res, 'Invalid email or password.', 401);
    }
    if (err.status || err.statusCode) {
      return error(res, err.message, err.status || err.statusCode);
    }

    return nextError(res, err);
  }
};

const nextError = (res, err) => {
  console.error('Admin login error:', err.message);
  return error(res, 'Administrator login is temporarily unavailable.', 500);
};

export default { login };
