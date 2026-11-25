import {
  registerSchema,
  loginSchema,
  resubmitVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from './auth.validator.js';
import authService from './auth.service.js';
import prisma from '../../config/prisma.js';
import { serializePrivateAccount } from '../../utils/serializers.js';
import { success, error } from '../../utils/response.js';
import socketService from '../../services/socketService.js';
import analyticsService from '../../services/analyticsService.js';

export const register = async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed: Please ensure all required fields, at least 2 photos, and a valid verification ID are provided.', 400, parseResult.error.issues);
    }

    const result = await authService.registerUser(parseResult.data);
    return success(res, result, result.message, 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const login = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed', 400, parseResult.error.issues);
    }

    const identifier = parseResult.data.identifier || parseResult.data.email;
    const { password } = parseResult.data;
    const reqMeta = {
      ip: req.ip || req.socket?.remoteAddress || null,
      userAgent: req.get('user-agent') || null,
    };

    const result = await authService.loginUser(identifier, password, reqMeta);

    if (result.status === 'PENDING_APPROVAL') {
      return res.status(403).json({
        success: false,
        status: 'PENDING_APPROVAL',
        message: result.message,
        user: result.user,
      });
    }

    if (result.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        status: 'REJECTED',
        reason: result.reason,
        message: result.message,
        user: result.user,
      });
    }

    if (result.token) {
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    analyticsService.trackEvent({
      eventType: 'LOGIN_SUCCESSFUL',
      userId: result.user?.id || null,
      collegeName: result.user?.education?.collegeName || null,
      metadata: { ip: reqMeta.ip },
    });

    return success(res, result, result.message);
  } catch (err) {
    if (err.code === 'ACCOUNT_NOT_ACTIVE' || err.code === 'ACCOUNT_SUSPENDED') {
      return res.status(err.statusCode || 403).json({
        success: false,
        code: err.code,
        message: err.message,
        details: err.details,
      });
    }
    return error(res, err.message, 401);
  }
};

export const resubmitVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const parseResult = resubmitVerificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed', 400, parseResult.error.issues);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...parseResult.data,
        verificationStatus: 'PENDING_APPROVAL',
        rejectionReason: null,
      },
      select: {
        id: true,
        displayName: true,
        verificationStatus: true,
      },
    });

    return success(
      res,
      updated,
      'Your updated details and verification ID have been re-submitted for admin approval.'
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'A valid email address is required', 400, parseResult.error.issues);
    }

    const reqMeta = {
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.requestPasswordReset(parseResult.data.email, reqMeta);
    return success(res, result, result.message);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed', 400, parseResult.error.issues);
    }

    const { token, newPassword } = parseResult.data;
    const result = await authService.resetPassword(token, newPassword);
    return success(res, result, result.message);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

export const changePassword = async (req, res) => {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed', 400, parseResult.error.issues);
    }

    const { currentPassword, newPassword } = parseResult.data;
    const currentSessionId = req.headers['x-session-id'] || req.user?.sessionId || null;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword, currentSessionId);
    return success(res, result, result.message);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

export const refresh = async (req, res) => {
  try {
    const rawRefreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    const parseResult = refreshTokenSchema.safeParse({ refreshToken: rawRefreshToken });
    if (!parseResult.success) {
      return error(res, 'A valid refresh token is required', 400, parseResult.error.issues);
    }

    const result = await authService.refreshToken(parseResult.data.refreshToken);
    if (result.token) {
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    return success(res, result, 'Token refreshed successfully');
  } catch (err) {
    return error(res, err.message, err.statusCode || 401);
  }
};

export const logout = async (req, res) => {
  const rawRefreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
  const sessionId = req.body?.sessionId || req.headers['x-session-id'] || req.user?.sessionId || null;
  const userId = req.user?.id;

  if (userId) {
    await authService.logoutUser(userId, rawRefreshToken, sessionId).catch(() => {});
    if (sessionId) {
      socketService.disconnectSessionSockets(userId, sessionId);
    }
  }
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return success(res, null, 'Logged out successfully');
};

export const getSessions = async (req, res) => {
  try {
    const currentSessionId = req.headers['x-session-id'] || req.user?.sessionId || null;
    const sessions = await authService.getUserSessions(req.user.id, currentSessionId);
    return success(res, { sessions }, 'Active sessions retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await authService.revokeUserSession(req.user.id, sessionId);
    return success(res, result, 'Session revoked successfully');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

export const revokeOtherSessions = async (req, res) => {
  try {
    const currentSessionId = req.headers['x-session-id'] || req.user?.sessionId || null;
    const result = await authService.revokeAllOtherSessions(req.user.id, currentSessionId);
    return success(res, result, result.message);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        education: { include: { college: true } },
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    const serialized = serializePrivateAccount(user);
    return success(res, { user: serialized }, 'Current user profile');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export default {
  register,
  login,
  logout,
  getSessions,
  revokeSession,
  revokeOtherSessions,
  resubmitVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  refresh,
  getMe,
};
