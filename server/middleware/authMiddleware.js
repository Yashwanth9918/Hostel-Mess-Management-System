import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Protect routes — verifies JWT token from Authorization header.
 *
 * Sets `req.user` if the token is valid and the user is active.
 * Throws AppError otherwise (caught by global error handler).
 */
export const protect = asyncHandler(async (req, res, next) => {
  // 1) Extract token from "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  // 2) Verify token (JWT errors are caught by errorMiddleware)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw new AppError('User belonging to this token no longer exists', 401);
  }

  // 4) Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  req.user = user;
  next();
});
