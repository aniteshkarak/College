import { error } from '../utils/response.js';

/**
 * Access Control Middleware:
 * Strictly prevents unapproved applicants (DRAFT, PENDING_REVIEW, UNDER_REVIEW,
 * NEEDS_CORRECTION, RESUBMITTED, REJECTED, SUSPENDED) from accessing any platform features.
 */
export const requireActiveAccount = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return error(res, 'Authentication required', 401);
  }

  // Check accountStatus
  if (user.accountStatus !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      error: 'ACCOUNT_NOT_ACTIVE',
      accountStatus: user.accountStatus,
      message: 'Your account is not active. Access to Collégé community features is restricted.',
      timestamp: new Date().toISOString()
    });
  }

  // Check verificationStatus
  if (user.verificationStatus !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      error: 'VERIFICATION_NOT_APPROVED',
      verificationStatus: user.verificationStatus,
      message: 'Your account is pending manual administrator verification. You cannot access platform features until approved.',
      timestamp: new Date().toISOString()
    });
  }

  return next();
};

export default requireActiveAccount;
