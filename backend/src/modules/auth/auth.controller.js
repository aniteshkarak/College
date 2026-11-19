import { registerSchema, loginSchema, resubmitVerificationSchema } from './auth.validator.js';
import authService from './auth.service.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';

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

    const { identifier, password } = parseResult.data;
    const result = await authService.loginUser(identifier, password);

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

    return success(res, result, result.message);
  } catch (err) {
    if (err.code === 'ACCOUNT_NOT_ACTIVE') {
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

export const getMe = async (req, res) => {
  return success(res, { user: req.user }, 'Current user profile');
};

export default { register, login, resubmitVerification, getMe };
