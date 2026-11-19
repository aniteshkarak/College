import { authService } from './auth.service.js';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validator.js';

export const authController = {
  /**
   * POST /api/v1/auth/login
   */
  login: async (req, res, next) => {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated);

      // Set HttpOnly Cookie for security
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({
        success: true,
        message: `Welcome back, ${result.user.display_name}!`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  logout: (req, res) => {
    res.clearCookie('access_token');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  },

  /**
   * GET /api/v1/auth/me
   */
  getMe: (req, res) => {
    const { password_hash, ...safeUser } = req.user;
    return res.status(200).json({
      success: true,
      data: safeUser
    });
  },

  /**
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (req, res, next) => {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(validated.email);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (req, res, next) => {
    try {
      const validated = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(validated);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};
