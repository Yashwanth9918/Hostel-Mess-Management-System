import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as userService from '../services/userService.js';

/**
 * User Controller
 *
 * Handles HTTP request/response only.
 * All business logic lives in userService.
 */

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  sendSuccess(res, users);
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Admin
export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role);
  sendSuccess(res, user, 'User role updated successfully');
});

// @desc    Get total student count (optionally by hostelId)
// @route   GET /api/users/count
// @access  Admin or Manager
export const getStudentCount = asyncHandler(async (req, res) => {
  const data = await userService.getStudentCount(req.query.hostelId);
  sendSuccess(res, data);
});
