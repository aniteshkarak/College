import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import config from '../../config/env.js';
import emailService from '../../services/emailService.js';
import notificationService, { NOTIFICATION_TYPES } from '../../services/notificationService.js';
import socketService from '../../services/socketService.js';
import { serializePrivateAccount } from '../../utils/serializers.js';
import logger from '../../utils/logger.js';

export const registerUser = async (data) => {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email.toLowerCase() },
        { mobileNumber: data.mobileNumber },
      ],
    },
  });

  if (existing) {
    if (existing.email.toLowerCase() === data.email.toLowerCase()) {
      throw new Error('A user with this email address already exists');
    }
    throw new Error('A user with this mobile number already exists');
  }

  // Calculate age from dateOfBirth
  const birthDate = new Date(data.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    throw new Error('Must be at least 18 years old to register');
  }

  // Hash password using Argon2id
  const passwordHash = await argon2.hash(data.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });

  const newUser = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      mobileNumber: data.mobileNumber,
      fullName: data.fullName,
      displayName: data.displayName,
      dateOfBirth: birthDate,
      age,
      gender: data.gender,
      accountStatus: 'ACTIVE',
      role: 'STUDENT',
      verificationStatus: 'PENDING_APPROVAL',
      profile: {
        create: {
          bio: `Verified student at ${data.collegeName}`,
          interests: data.interestedIn || ['Campus Life'],
          city: data.city,
          state: data.state,
          relationshipIntention: data.relationshipIntention || 'Casual Connection',
        },
      },
      education: {
        create: {
          collegeName: data.collegeName,
          degreeName: data.course || 'Degree Program',
          departmentStream: 'General Stream',
          academicYear: '1st Year',
          graduationYear: 2027,
          studentStatus: 'CURRENTLY_STUDYING',
        },
      },
    },
    include: {
      profile: true,
      education: true,
      photos: true,
    },
  });

  return {
    user: serializePrivateAccount(newUser),
    status: 'PENDING_APPROVAL',
    message: 'Your registration was submitted successfully! It is now pending admin review. Once an admin verifies your details, you will be able to log in.',
  };
};

export const loginUser = async (identifier, password, reqMeta = {}) => {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Please enter your email, mobile number, user ID, or application ID.');
  }

  const cleanId = identifier.trim();
  const cleanIdLower = cleanId.toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, '');
  const mobileVariants = [cleanId];
  if (digitsOnly.length === 10) {
    mobileVariants.push(digitsOnly);
    mobileVariants.push(`+91${digitsOnly}`);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    mobileVariants.push(digitsOnly.slice(2));
    mobileVariants.push(`+${digitsOnly}`);
  }

  // Look up User by email, mobile variants, user ID, applicationId, or linked application code
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanIdLower, mode: 'insensitive' } },
        { mobileNumber: { in: mobileVariants } },
        { id: cleanId },
        { applicationId: cleanId },
        { application: { applicationId: { equals: cleanId, mode: 'insensitive' } } },
      ],
    },
    include: {
      profile: true,
      education: { include: { college: true } },
      photos: { orderBy: { photoOrder: 'asc' } },
      application: true,
    },
  });

  if (!user) {
    // Check if the user is in PendingRegistration stage
    const pending = await prisma.pendingRegistration.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdLower, mode: 'insensitive' } },
          { mobileNumber: { in: mobileVariants } },
          { id: cleanId },
          { applicationId: { equals: cleanId, mode: 'insensitive' } },
        ],
      },
    });

    if (pending) {
      let isMatch = await argon2.verify(pending.passwordHash, password).catch(() => false);
      if (!isMatch && password.trim() !== password) {
        isMatch = await argon2.verify(pending.passwordHash, password.trim()).catch(() => false);
      }

      if (isMatch) {
        const err = new Error(`Application status: ${pending.status}. Review may take up to 72 hours.`);
        err.code = 'ACCOUNT_NOT_ACTIVE';
        err.statusCode = 403;
        err.details = {
          applicationId: pending.applicationId,
          status: pending.status,
          submittedAt: pending.submittedAt,
          reviewDeadline: pending.reviewDeadline,
          isOverdue: pending.isOverdue,
          correctionFields: pending.correctionFields || [],
          correctionMessage: pending.correctionMessage || null,
          rejectionReason: pending.rejectionReason || null,
        };
        throw err;
      } else {
        throw new Error('Incorrect password. Please try again.');
      }
    }

    throw new Error('Incorrect credentials. No account found with this email, mobile number, or ID.');
  }

  let isMatch = await argon2.verify(user.passwordHash, password).catch(() => false);
  if (!isMatch && password.trim() !== password) {
    isMatch = await argon2.verify(user.passwordHash, password.trim()).catch(() => false);
  }

  // Fallback check against linked application passwordHash (and auto-heal if matched)
  if (!isMatch && user.application?.passwordHash) {
    let pendingMatch = await argon2.verify(user.application.passwordHash, password).catch(() => false);
    if (!pendingMatch && password.trim() !== password) {
      pendingMatch = await argon2.verify(user.application.passwordHash, password.trim()).catch(() => false);
    }
    if (pendingMatch) {
      isMatch = true;
      const newHash = await argon2.hash(password.trim());
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }).catch((e) => logger.warn(`Failed to auto-heal user passwordHash: ${e.message}`));
    }
  }

  if (!isMatch) {
    throw new Error('Incorrect password. Please try again.');
  }

  // Keep PendingRegistration passwordHash in sync if pending record exists
  if (user.applicationId) {
    prisma.pendingRegistration.update({
      where: { id: user.applicationId },
      data: { passwordHash: user.passwordHash },
    }).catch(() => {});
  }

  const sanitizedUser = serializePrivateAccount(user);

  // Check Account Status
  if (user.accountStatus === 'SUSPENDED') {
    const err = new Error('Your account has been suspended by administration. Please contact support.');
    err.code = 'ACCOUNT_SUSPENDED';
    err.statusCode = 403;
    throw err;
  }

  // Check Admin Verification Approval Status
  if (user.verificationStatus === 'PENDING_APPROVAL') {
    return {
      status: 'PENDING_APPROVAL',
      user: sanitizedUser,
      message: 'Your account is currently under admin review. Campus administrators are checking your details. Please check back shortly.',
    };
  }

  if (user.verificationStatus === 'REJECTED') {
    return {
      status: 'REJECTED',
      user: sanitizedUser,
      message: 'Your verification was declined. Please re-submit your updated details.',
    };
  }

  // User is APPROVED: Issue Access Token + Refresh Token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Persist session in UserSession
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash,
      ipAddress: reqMeta.ip || null,
      userAgent: reqMeta.userAgent || null,
      deviceId: reqMeta.deviceId || null,
      lastActivityAt: new Date(),
      expiresAt,
    },
  }).catch((err) => {
    logger.warn(`Session record failed: ${err.message}`);
    return null;
  });

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, sessionId: session?.id || null },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn, issuer: 'college-api', audience: 'college-mobile-web' }
  );

  return {
    status: 'APPROVED',
    user: sanitizedUser,
    token,
    refreshToken,
    sessionId: session?.id || null,
    expiresIn: config.jwt.expiresIn,
    message: 'Login successful! Welcome to Collage Story.',
  };
};

export const requestPasswordReset = async (email, reqMeta = {}) => {
  const cleanEmail = (email || '').toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  // Always return generic success to prevent email enumeration
  if (!user || user.accountStatus === 'SUSPENDED') {
    return {
      success: true,
      message: 'If an account matches this email, a password reset link has been dispatched.',
    };
  }

  // Generate cryptographically secure random token (32 bytes = 64 hex characters)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

  // Invalidate any existing unused reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  }).catch(() => {});

  // Persist token hash with short expiration
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: reqMeta.ip || null,
      userAgent: reqMeta.userAgent || null,
    },
  });

  const frontendUrl = config.frontendUrl || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/?resetToken=${rawToken}`;

  emailService.sendPasswordResetEmail({
    email: user.email,
    resetToken: rawToken,
    resetUrl,
  }).catch((err) => logger.warn(`Password reset email failed: ${err.message}`));

  return {
    success: true,
    message: 'If an account matches this email, a password reset link has been dispatched.',
  };
};

export const resetPassword = async (rawToken, newPassword) => {
  if (!rawToken || typeof rawToken !== 'string') {
    const error = new Error('Invalid or missing password reset token.');
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  // Check token in database
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!tokenRecord) {
    const error = new Error('Invalid or expired password reset token.');
    error.statusCode = 400;
    throw error;
  }

  if (tokenRecord.usedAt !== null) {
    const error = new Error('Password reset token has already been used. Please request a new link.');
    error.statusCode = 400;
    throw error;
  }

  if (new Date(tokenRecord.expiresAt) < new Date()) {
    const error = new Error('Password reset token has expired. Please request a new link.');
    error.statusCode = 400;
    throw error;
  }

  if (!tokenRecord.user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  if (tokenRecord.user.accountStatus === 'SUSPENDED') {
    const error = new Error('This account is suspended. Please contact platform administration.');
    error.statusCode = 403;
    throw error;
  }

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });

  // Concurrency-safe atomic transaction
  await prisma.$transaction(async (tx) => {
    // Atomically mark token as used - only succeeds if usedAt is still null
    const updated = await tx.passwordResetToken.updateMany({
      where: {
        id: tokenRecord.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      const err = new Error('Password reset token has already been used.');
      err.statusCode = 400;
      throw err;
    }

    // Update user password hash
    await tx.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    });

    // Invalidate all active user sessions according to account security policy
    await tx.userSession.deleteMany({
      where: { userId: tokenRecord.userId },
    });
  });

  // Disconnect all real-time socket connections for this user immediately
  socketService.disconnectAllUserSessions(tokenRecord.userId);

  // Security notification & email alert
  emailService.sendSecurityAlert({
    email: tokenRecord.user.email,
    alertType: 'Password Reset Completed',
    details: 'Your account password was successfully reset. All active sessions across all devices have been signed out for security.',
  }).catch(() => {});

  notificationService.createNotification({
    recipientId: tokenRecord.userId,
    type: NOTIFICATION_TYPES.ADMIN_NOTICE,
    title: 'Password Reset Successful',
    message: 'Your account password has been updated. All previous sessions were signed out.',
  }).catch(() => {});

  return {
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.',
  };
};

export const changePassword = async (userId, currentPassword, newPassword, currentSessionId = null) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  if (user.accountStatus === 'SUSPENDED') {
    const error = new Error('This account is suspended.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await argon2.verify(user.passwordHash, currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all other active sessions
    if (currentSessionId) {
      await tx.userSession.deleteMany({
        where: {
          userId,
          id: { not: currentSessionId },
        },
      });
    } else {
      await tx.userSession.deleteMany({
        where: { userId },
      });
    }
  });

  // Cut off other sessions' real-time connections
  socketService.disconnectAllUserSessions(userId, currentSessionId);

  emailService.sendSecurityAlert({
    email: user.email,
    alertType: 'Password Changed',
    details: 'Your Collage Story account password was changed. If you did not make this change, please contact support immediately.',
  }).catch(() => {});

  notificationService.createNotification({
    recipientId: userId,
    type: NOTIFICATION_TYPES.ADMIN_NOTICE,
    title: 'Password Changed',
    message: 'Your account password was changed successfully.',
  }).catch(() => {});

  return {
    success: true,
    message: 'Password changed successfully. All other active sessions have been signed out.',
  };
};

export const refreshToken = async (rawRefreshToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  const session = await prisma.userSession.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          profile: true,
          education: true,
          photos: { orderBy: { photoOrder: 'asc' } },
        },
      },
    },
  });

  if (!session || !session.user || session.user.accountStatus !== 'ACTIVE') {
    const error = new Error('Invalid or expired refresh token.');
    error.statusCode = 401;
    throw error;
  }

  // Issue new access token
  const token = jwt.sign(
    { sub: session.user.id, email: session.user.email, role: session.user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn, issuer: 'college-api', audience: 'college-mobile-web' }
  );

  return {
    success: true,
    token,
    user: serializePrivateAccount(session.user),
  };
};

export const parseUserAgent = (ua) => {
  if (!ua) return { deviceType: 'Desktop', os: 'Unknown OS', browser: 'Browser' };
  let deviceType = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Browser';

  const uaLower = ua.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(uaLower)) {
    deviceType = /ipad|tablet/.test(uaLower) ? 'Tablet' : 'Mobile';
  }

  if (uaLower.includes('android')) os = 'Android';
  else if (/iphone|ipad|ipod/.test(uaLower)) os = 'iOS';
  else if (uaLower.includes('windows')) os = 'Windows';
  else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) os = 'macOS';
  else if (uaLower.includes('linux')) os = 'Linux';

  if (uaLower.includes('chrome') && !uaLower.includes('edg')) browser = 'Chrome';
  else if (uaLower.includes('safari') && !uaLower.includes('chrome')) browser = 'Safari';
  else if (uaLower.includes('firefox')) browser = 'Firefox';
  else if (uaLower.includes('edg')) browser = 'Edge';

  return { deviceType, os, browser };
};

export const getUserSessions = async (userId, currentSessionId = null) => {
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: 'desc' },
  });

  return sessions.map((s) => {
    const meta = parseUserAgent(s.userAgent);
    return {
      id: s.id,
      deviceType: meta.deviceType,
      os: meta.os,
      browser: meta.browser,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
      isCurrentSession: currentSessionId ? s.id === currentSessionId : false,
    };
  });
};

export const revokeUserSession = async (userId, sessionId) => {
  const session = await prisma.userSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    const err = new Error('Session not found or already revoked.');
    err.statusCode = 404;
    throw err;
  }

  await prisma.userSession.delete({
    where: { id: sessionId },
  });

  socketService.disconnectSessionSockets(userId, sessionId);

  return { success: true, sessionId };
};

export const revokeAllOtherSessions = async (userId, currentSessionId = null) => {
  if (currentSessionId) {
    await prisma.userSession.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });
  } else {
    await prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  socketService.disconnectAllUserSessions(userId, currentSessionId);

  return {
    success: true,
    message: 'All other active sessions have been signed out.',
  };
};

export const logoutUser = async (userId, rawRefreshToken, sessionId = null) => {
  if (sessionId) {
    await prisma.userSession.deleteMany({
      where: { id: sessionId, userId },
    }).catch(() => {});
  } else if (rawRefreshToken) {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await prisma.userSession.deleteMany({
      where: { userId, tokenHash },
    }).catch(() => {});
  } else {
    // Invalidate all sessions for user
    await prisma.userSession.deleteMany({
      where: { userId },
    }).catch(() => {});
  }

  return { success: true };
};

export default {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  changePassword,
  refreshToken,
  logoutUser,
  getUserSessions,
  revokeUserSession,
  revokeAllOtherSessions,
  parseUserAgent,
};
