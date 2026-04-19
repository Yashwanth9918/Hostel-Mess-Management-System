import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import * as mealTokenService from '../services/mealTokenService.js';

/**
 * Meal Token Controller
 *
 * Handles HTTP layer for QR-based attendance tokens.
 */

// @desc    Generate a QR token for a specific meal
// @route   POST /api/meal-tokens/generate
// @access  Private (Manager/Admin)
export const generateToken = asyncHandler(async (req, res) => {
  const { date, mealType } = req.body;

  const token = await mealTokenService.generateToken(
    req.user.hostelId,
    date,
    mealType,
    req.user._id
  );

  sendCreated(res, token, `QR token generated for ${mealType}`);
});

// @desc    Get all tokens for a hostel on a date
// @route   GET /api/meal-tokens/:hostelId/:date
// @access  Private (Manager/Admin)
export const getTokensForDate = asyncHandler(async (req, res) => {
  const { hostelId, date } = req.params;

  // Managers can only view their own hostel
  if (req.user.role === 'manager' && req.user.hostelId !== hostelId) {
    return res.status(403).json({
      success: false,
      message: 'You can only view tokens for your assigned hostel',
    });
  }

  const tokens = await mealTokenService.getTokensForDate(hostelId, date);
  sendSuccess(res, tokens, 'Tokens retrieved');
});

// @desc    Student scans a QR token to mark attendance
// @route   POST /api/meal-tokens/scan
// @access  Private (Student)
export const scanToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const result = await mealTokenService.validateAndMarkAttendance(
    token,
    req.user._id,
    req.user.hostelId
  );

  sendSuccess(res, result, result.message);
});

// @desc    Deactivate a token
// @route   PUT /api/meal-tokens/:id/deactivate
// @access  Private (Manager/Admin)
export const deactivateToken = asyncHandler(async (req, res) => {
  const token = await mealTokenService.deactivateToken(req.params.id);
  sendSuccess(res, token, 'Token deactivated');
});
