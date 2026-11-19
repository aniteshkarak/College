export const authorizeAdmin = (allowedRoles = ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Insufficient administrative privileges. Access denied.'
      });
    }

    next();
  };
};

export const requireSuperAdmin = authorizeAdmin(['SUPER_ADMIN']);
export const requireVerificationAdmin = authorizeAdmin(['SUPER_ADMIN', 'VERIFICATION_ADMIN']);
