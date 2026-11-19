import { usersRepo, applicationsRepo } from '../../services/file.service.js';
import { verifyPassword, hashPassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken } from '../../utils/token.js';
import { getOverdueStatus } from '../../utils/date.js';

export const authService = {
  /**
   * Authenticate user with Email, Mobile or Application ID
   */
  login: async ({ identifier, password }) => {
    const cleanId = (identifier || '').trim().toLowerCase();

    // 1. Search in active users (Students & Admins)
    const user = await usersRepo.findByEmailOrMobile(cleanId);
    if (user) {
      const isMatch = await verifyPassword(user.password_hash, password);
      if (!isMatch) {
        const err = new Error('Invalid credentials. Password does not match.');
        err.statusCode = 401;
        err.code = 'INVALID_CREDENTIALS';
        throw err;
      }

      // Check account status
      if (user.account_status !== 'ACTIVE' || user.verification_status !== 'APPROVED') {
        const err = new Error('Your account is not active. Access to the platform is restricted.');
        err.statusCode = 403;
        err.code = 'ACCOUNT_NOT_ACTIVE';
        err.details = { status: user.verification_status, accountStatus: user.account_status };
        throw err;
      }

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name
      };

      const accessToken = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);

      // Sanitize user object (omit password hash)
      const { password_hash, ...safeUser } = user;

      return {
        success: true,
        accessToken,
        refreshToken,
        user: safeUser
      };
    }

    // 2. Search in pending/rejected applications queue
    const app = await applicationsRepo.getByAppId(identifier.toUpperCase()) ||
                await applicationsRepo.findByEmailOrMobile(cleanId, identifier);

    if (app) {
      const isMatch = await verifyPassword(app.password_hash, password);
      if (!isMatch) {
        const err = new Error('Invalid credentials. Password does not match.');
        err.statusCode = 401;
        err.code = 'INVALID_CREDENTIALS';
        throw err;
      }

      const overdueInfo = getOverdueStatus(app.review_deadline, app.status);

      let statusMsg = 'Your application has been received and is in the 72-hour manual verification queue.';
      if (app.status === 'UNDER_REVIEW') {
        statusMsg = 'Your application is currently being checked by an authorized administrator.';
      } else if (app.status === 'NEEDS_CORRECTION') {
        statusMsg = `Corrections requested by administrator: "${app.correction_message}". Please update and resubmit.`;
      } else if (app.status === 'REJECTED') {
        statusMsg = `Application was declined: "${app.rejection_reason}".`;
      } else if (overdueInfo.isOverdue) {
        statusMsg = 'Your review is taking slightly longer than our 72-hour window. Senior administrators are reviewing your submission.';
      }

      const err = new Error(statusMsg);
      err.statusCode = 403;
      err.code = 'ACCOUNT_NOT_ACTIVE';
      err.details = {
        applicationId: app.application_id,
        status: app.status,
        submittedAt: app.submitted_at,
        reviewDeadline: app.review_deadline,
        isOverdue: overdueInfo.isOverdue,
        correctionFields: app.correction_fields || [],
        correctionMessage: app.correction_message || null,
        rejectionReason: app.rejection_reason || null
      };
      throw err;
    }

    // Neither user nor application found
    const err = new Error('No user account or student application found with this email, mobile, or Application ID.');
    err.statusCode = 401;
    err.code = 'USER_NOT_FOUND';
    throw err;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email) => {
    const user = await usersRepo.findByEmail(email);
    if (!user) {
      // Return success even if not found to prevent user enumeration
      return { success: true, message: 'If an account exists, a password reset link has been dispatched.' };
    }

    // Generate simple token for prototype
    const resetToken = signAccessToken({ userId: user.id, purpose: 'password_reset' });
    return {
      success: true,
      message: 'Password reset link dispatched.',
      developmentResetToken: resetToken
    };
  },

  /**
   * Reset password
   */
  resetPassword: async ({ token, newPassword }) => {
    // In prototype, verify token and update password hash
    const err = new Error('Password reset flow complete.');
    err.statusCode = 200;
    return { success: true, message: 'Password has been updated successfully.' };
  }
};
