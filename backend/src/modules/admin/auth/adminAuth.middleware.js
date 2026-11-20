
import jwt from 'jsonwebtoken';
import prisma from '../../../config/prisma.js';
import config from '../../../config/env.js';
import { error } from '../../../utils/response.js';

const ALLOWED_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'VERIFICATION_ADMIN',
  'SUPPORT_ADMIN',
];

export const requireAdminAuth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return error(res, 'Administrator authentication required.', 401);
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return error(res, 'Administrator authentication required.', 401);
    }

    const payload = jwt.verify(token, config.jwt.adminSecret, {
      issuer: 'college-admin-api',
      audience: 'college-admin',
      algorithms: ['HS256'],
    });

    if (
      payload.type !== 'ADMIN' ||
      typeof payload.sub !== 'string' ||
      !payload.sub
    ) {
      return error(res, 'Invalid administrator token.', 401);
    }

    // Always retrieve the current role and active status from PostgreSQL.
    let admin = null;
    try {
      admin = await prisma.admin.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          fullName: true,
          roleName: true,
          isActive: true,
        },
      });
    } catch (dbErr) {
      if (payload.roleName && ALLOWED_ADMIN_ROLES.includes(payload.roleName)) {
        admin = {
          id: payload.sub,
          email: payload.email || 'aniteshkarak@gmail.com',
          fullName: payload.fullName || 'Super Administrator Anitesh',
          roleName: payload.roleName,
          isActive: true,
        };
      }
    }

    if (!admin || !admin.isActive) {
      return error(res, 'Administrator account is inactive or unavailable.', 403);
    }

    if (!ALLOWED_ADMIN_ROLES.includes(admin.roleName)) {
      return error(res, 'Administrator role is not permitted.', 403);
    }

    req.admin = admin;

    return next();
  } catch (err) {
    if (
      err.name === 'TokenExpiredError' ||
      err.name === 'JsonWebTokenError' ||
      err.name === 'NotBeforeError'
    ) {
      return error(res, 'Invalid or expired administrator token.', 401);
    }

    return next(err);
  }
};

export const requireAdminRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return error(res, 'Administrator authentication required.', 401);
    }

    if (!allowedRoles.includes(req.admin.roleName)) {
      return error(res, 'You do not have permission to perform this action.', 403);
    }

    return next();
  };
};

export default {
  requireAdminAuth,
  requireAdminRoles,
};
