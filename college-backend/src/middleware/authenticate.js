import { verifyToken } from '../utils/token.js';
import { usersRepo } from '../services/file.service.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      // 2. Fallback to HttpOnly cookie
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication token required. Please log in.'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired session token. Please log in again.'
      });
    }

    // 3. Retrieve user from storage
    const user = await usersRepo.getById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Account associated with token does not exist.'
      });
    }

    // 4. Strict Active & Approved Guard:
    // Only ACTIVE accounts with APPROVED verification can access protected platform routes
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'VERIFICATION_ADMIN') {
      if (user.account_status !== 'ACTIVE' || user.verification_status !== 'APPROVED') {
        return res.status(403).json({
          success: false,
          error: 'ACCOUNT_NOT_ACTIVE',
          message: 'Your account is pending manual administrator verification. Access to community features is restricted.',
          status: user.verification_status || 'PENDING_REVIEW'
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
