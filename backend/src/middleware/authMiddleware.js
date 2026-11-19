import passport from '../config/passport.js';
import { error } from '../utils/response.js';

export const requireAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return error(res, 'Authentication required. Invalid or expired token.', 401, info?.message);
    }
    req.user = user;
    return next();
  })(req, res, next);
};

export default requireAuth;
