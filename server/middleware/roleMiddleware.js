import AppError from '../utils/AppError.js';

/**
 * Grant access to specific roles.
 *
 * Usage in routes:
 *   router.get('/admin-only', protect, authorize('admin'), controller);
 *   router.get('/multi', protect, authorize('admin', 'manager'), controller);
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }

    next();
  };
};
