import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import * as attendanceService from '../services/attendanceService.js';

/**
 * Attendance Controller
 *
 * Handles HTTP request/response only.
 * All business logic lives in attendanceService.
 */

// @desc    Mark daily attendance (create/update)
// @route   POST /api/attendance
// @access  Private (Student)
export const markAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.markAttendance(
    req.user._id,
    req.user.hostelId,
    req.body
  );

  const statusCode = result.createdAt === result.updatedAt ? 201 : 200;
  const message = statusCode === 201 ? 'Attendance marked' : 'Attendance updated';

  if (statusCode === 201) {
    return sendCreated(res, result, message);
  }
  sendSuccess(res, result, message);
});

// @desc    Register leave for multiple days
// @route   POST /api/attendance/leave
// @access  Private (Student)
export const registerLeave = asyncHandler(async (req, res) => {
  const attendanceRecords = await attendanceService.registerLeave(
    req.user._id,
    req.user.hostelId,
    req.body
  );

  sendCreated(
    res,
    attendanceRecords,
    `Leave registered successfully for ${attendanceRecords.length} days.`
  );
});

// @desc    Get my attendance for date range
// @route   GET /api/attendance/my-attendance
// @access  Private (Student)
export const getMyAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const attendance = await attendanceService.getMyAttendance(req.user._id, startDate, endDate);

  sendSuccess(res, attendance, 'Success');
});

// @desc    Get monthly attendance for a student
// @route   GET /api/attendance/monthly/:month/:year
// @access  Private
export const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const { month, year } = req.params;
  const { studentId } = req.query;

  const result = await attendanceService.getMonthlyAttendance(
    req.user._id,
    req.user.role,
    month,
    year,
    studentId
  );

  sendSuccess(res, result.attendance, 'Success');
});

// @desc    Get attendance summary for billing
// @route   GET /api/attendance/summary/:studentId/:month/:year
// @access  Private (Admin/Manager only)
export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { studentId, month, year } = req.params;
  const result = await attendanceService.getAttendanceSummary(studentId, month, year);

  sendSuccess(res, result);
});

// @desc    Get mess-wise attendance for a date
// @route   GET /api/attendance/mess/:hostelId/:date
// @access  Private (Manager/Admin only)
export const getMessAttendance = asyncHandler(async (req, res) => {
  const { hostelId, date } = req.params;
  const result = await attendanceService.getMessAttendance(req.user, hostelId, date);

  sendSuccess(res, result);
});

// @desc    Update attendance (for managers/admin)
// @route   PUT /api/attendance/:id
// @access  Private (Manager/Admin only)
export const updateAttendance = asyncHandler(async (req, res) => {
  const updatedAttendance = await attendanceService.updateAttendance(
    req.user,
    req.params.id,
    req.body
  );

  sendSuccess(res, updatedAttendance, 'Attendance updated successfully');
});

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Admin only)
export const deleteAttendance = asyncHandler(async (req, res) => {
  await attendanceService.deleteAttendance(req.params.id);
  sendSuccess(res, null, 'Attendance record deleted successfully');
});

// @desc    Cancel leave
// @route   PUT /api/attendance/cancel-leave/:id
// @access  Private (Student - own leave, Admin/Manager - any leave)
export const cancelLeave = asyncHandler(async (req, res) => {
  await attendanceService.cancelLeave(req.user, req.params.id);
  sendSuccess(res, null, 'Leave cancelled and record removed successfully');
});
