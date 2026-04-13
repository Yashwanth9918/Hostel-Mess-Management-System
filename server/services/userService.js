import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * User Service
 *
 * Contains all business logic for user management operations.
 */

const VALID_ROLES = ['student', 'manager', 'admin'];

/**
 * Get all users (admin).
 */
export const getAllUsers = async () => {
  return await User.find().select('name email role messId');
};

/**
 * Update user role.
 */
export const updateUserRole = async (userId, role) => {
  if (!VALID_ROLES.includes(role)) {
    throw new AppError('Invalid role specified', 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select('name email role messId');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

/**
 * Get student count (optionally by messId).
 */
export const getStudentCount = async (messId) => {
  const query = { role: 'student' };
  if (messId) query.messId = messId;

  const totalStudents = await User.countDocuments(query);
  return { totalStudents };
};
