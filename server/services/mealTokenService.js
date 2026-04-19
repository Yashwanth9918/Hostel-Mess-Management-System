import crypto from 'crypto';
import MealToken from '../models/MealToken.js';
import Attendance from '../models/Attendance.js';
import AppError from '../utils/AppError.js';

/**
 * Meal Token Service
 *
 * Handles QR token generation, validation, and attendance marking via scan.
 */

// ── Meal time windows (server‑local time) ─────────────────────────
const MEAL_WINDOWS = {
  breakfast: { startHour: 7, durationHours: 3 },  // 07:00 – 10:00
  lunch:     { startHour: 12, durationHours: 3 },  // 12:00 – 15:00
  dinner:    { startHour: 19, durationHours: 3 },  // 19:00 – 22:00
};

/**
 * Compute the expiry timestamp for a given date + meal.
 */
const computeExpiry = (date, mealType) => {
  const window = MEAL_WINDOWS[mealType];
  if (!window) throw new AppError(`Unknown meal type: ${mealType}`, 400);

  const expiry = new Date(date);
  expiry.setHours(window.startHour + window.durationHours, 0, 0, 0);
  return expiry;
};

/**
 * Generate a single QR token for a specific hostel + date + meal.
 * Idempotent: if token already exists, returns the existing one.
 */
export const generateToken = async (hostelId, date, mealType, createdBy) => {
  const tokenDate = new Date(date);
  tokenDate.setHours(0, 0, 0, 0);

  // Check if token already exists
  const existing = await MealToken.findOne({
    hostelId,
    date: tokenDate,
    mealType,
  });

  if (existing) {
    return existing;
  }

  const token = crypto.randomUUID();
  const expiresAt = computeExpiry(tokenDate, mealType);

  const mealToken = await MealToken.create({
    hostelId,
    date: tokenDate,
    mealType,
    token,
    createdBy,
    expiresAt,
    isActive: true,
  });

  return mealToken;
};

/**
 * Get all tokens for a hostel on a given date.
 */
export const getTokensForDate = async (hostelId, date) => {
  const tokenDate = new Date(date);
  tokenDate.setHours(0, 0, 0, 0);

  const tokens = await MealToken.find({ hostelId, date: tokenDate })
    .sort({ mealType: 1 })
    .populate('createdBy', 'name email');

  return tokens;
};

/**
 * Validate a scanned token and mark the student present for that meal.
 *
 * Checks:
 * 1. Token exists and is active
 * 2. Token has not expired
 * 3. Student's hostelId matches the token's hostelId  (cross-hostel protection)
 * 4. Student has not already scanned for this meal today
 */
export const validateAndMarkAttendance = async (tokenValue, studentId, studentHostelId) => {
  // 1) Look up token
  const mealToken = await MealToken.findOne({ token: tokenValue });

  if (!mealToken) {
    throw new AppError('Invalid QR code. Token not found.', 404);
  }

  if (!mealToken.isActive) {
    throw new AppError('This QR code has been deactivated by the manager.', 400);
  }

  // 2) Expiry check
  if (new Date() > mealToken.expiresAt) {
    throw new AppError(
      `This QR code has expired. ${mealToken.mealType} window ended at ${mealToken.expiresAt.toLocaleTimeString()}.`,
      400
    );
  }

  // 3) Cross-hostel protection
  if (mealToken.hostelId !== studentHostelId) {
    throw new AppError('You can only scan QR codes for your own hostel mess.', 403);
  }

  // 4) Find or create today's attendance record
  const attendanceDate = new Date(mealToken.date);
  attendanceDate.setHours(0, 0, 0, 0);

  let attendance = await Attendance.findOne({ studentId, date: attendanceDate });

  // Check if already scanned for this meal
  if (attendance) {
    const existingMeal = attendance.meals.find(
      (m) => m.mealType === mealToken.mealType && m.isPresent
    );
    if (existingMeal) {
      throw new AppError(
        `You have already scanned for ${mealToken.mealType} today.`,
        400
      );
    }
  }

  // Create record if it doesn't exist
  if (!attendance) {
    attendance = new Attendance({
      studentId,
      hostelId: studentHostelId,
      date: attendanceDate,
      meals: [],
      isOnLeave: false,
    });
  }

  // If student was on leave, prevent scanning
  if (attendance.isOnLeave) {
    throw new AppError(
      'You are marked on leave for this date. Cancel your leave first to scan attendance.',
      400
    );
  }

  // Mark the meal as present
  attendance.markMealAttendance(mealToken.mealType, true, 'student');
  await attendance.save();

  return {
    mealType: mealToken.mealType,
    date: mealToken.date,
    hostelId: mealToken.hostelId,
    message: `${mealToken.mealType.charAt(0).toUpperCase() + mealToken.mealType.slice(1)} attendance marked successfully!`,
    attendance,
  };
};

/**
 * Deactivate a token (manager action).
 */
export const deactivateToken = async (tokenId) => {
  const mealToken = await MealToken.findById(tokenId);

  if (!mealToken) {
    throw new AppError('Token not found', 404);
  }

  mealToken.isActive = false;
  await mealToken.save();

  return mealToken;
};
