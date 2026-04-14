import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Attendance Service
 *
 * Contains all business logic for attendance operations.
 */

/**
 * Mark daily attendance (create or update).
 */
export const markAttendance = async (studentId, hostelId, { date, meals, isOnLeave }) => {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ studentId, date: attendanceDate });

  // Disallow marking attendance during leave
  if (attendance && attendance.isOnLeave) {
    throw new AppError('Cannot mark attendance for a date that is marked as leave.', 400);
  }

  if (attendance) {
    attendance.meals = meals || attendance.meals;
    attendance.isOnLeave = isOnLeave ?? attendance.isOnLeave;
    await attendance.save();
    return attendance;
  }

  // Create new record
  const newRecord = await Attendance.create({
    studentId,
    hostelId,
    date: attendanceDate,
    meals: meals || [],
    isOnLeave: isOnLeave || false,
  });

  return newRecord;
};

/**
 * Register leave for multiple days.
 */
export const registerLeave = async (studentId, hostelId, { startDate, endDate, reason, description }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Basic date validations
  if (end < start) {
    throw new AppError('End date must be after start date', 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    throw new AppError('Cannot register leave for past dates', 400);
  }

  // Delegate to model static method (handles overlap checks)
  const attendanceRecords = await Attendance.registerLeave(
    studentId,
    hostelId,
    start,
    end,
    reason,
    description
  );

  return attendanceRecords;
};

/**
 * Get attendance for a student by date range.
 */
export const getMyAttendance = async (studentId, startDate, endDate) => {
  const attendance = await Attendance.getAttendanceByDateRange(
    studentId,
    new Date(startDate),
    new Date(endDate)
  );

  return attendance;
};

/**
 * Get monthly attendance with summary.
 */
export const getMonthlyAttendance = async (userId, userRole, month, year, queryStudentId) => {
  // Students can only view their own attendance
  let targetStudentId = userId;

  if (queryStudentId && (userRole === 'manager' || userRole === 'admin')) {
    targetStudentId = queryStudentId;
  }

  const attendance = await Attendance.getMonthlyAttendance(
    targetStudentId,
    parseInt(month),
    parseInt(year)
  );

  const summary = await Attendance.getAttendanceSummary(
    targetStudentId,
    parseInt(month),
    parseInt(year)
  );

  return { attendance, summary };
};

/**
 * Get attendance summary for billing purposes.
 */
export const getAttendanceSummary = async (studentId, month, year) => {
  const summary = await Attendance.getAttendanceSummary(
    studentId,
    parseInt(month),
    parseInt(year)
  );

  const student = await User.findById(studentId)
    .select('name email registrationNumber hostelId');

  return { student, summary };
};

/**
 * Get mess-wise attendance for a date.
 */
export const getMessAttendance = async (user, hostelId, date) => {
  // Managers can only view their own hostel
  if (user.role === 'manager' && user.hostelId !== hostelId) {
    throw new AppError('You can only view attendance for your assigned hostel', 403);
  }

  const attendance = await Attendance.getMessAttendance(hostelId, new Date(date));

  // Calculate statistics
  const totalStudents = attendance.length;
  const studentsOnLeave = attendance.filter((a) => a.isOnLeave).length;
  const studentsPresent = attendance.filter((a) => !a.isOnLeave && a.totalMealsPresent > 0).length;

  return {
    statistics: {
      totalStudents,
      studentsPresent,
      studentsOnLeave,
      studentsAbsent: totalStudents - studentsPresent - studentsOnLeave,
    },
    attendance,
  };
};

/**
 * Update attendance record (manager/admin).
 */
export const updateAttendance = async (user, attendanceId, updateData) => {
  const attendance = await Attendance.findById(attendanceId);

  if (!attendance) {
    throw new AppError('Attendance record not found', 404);
  }

  // Managers can only update their own hostel
  if (user.role === 'manager' && user.hostelId !== attendance.hostelId) {
    throw new AppError('You can only update attendance for your assigned hostel', 403);
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    attendanceId,
    updateData,
    { new: true, runValidators: true }
  ).populate('studentId', 'name registrationNumber');

  return updatedAttendance;
};

/**
 * Delete attendance record (admin only).
 */
export const deleteAttendance = async (attendanceId) => {
  const attendance = await Attendance.findById(attendanceId);

  if (!attendance) {
    throw new AppError('Attendance record not found', 404);
  }

  await attendance.deleteOne();
};

/**
 * Cancel leave.
 */
export const cancelLeave = async (user, attendanceId) => {
  const attendance = await Attendance.findById(attendanceId);

  if (!attendance) {
    throw new AppError('Attendance record not found', 404);
  }

  // Students can only cancel their own leave
  if (user.role === 'student' && attendance.studentId.toString() !== user._id.toString()) {
    throw new AppError('You can only cancel your own leave', 403);
  }

  // Only allow cancelling upcoming leaves
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attDate = new Date(attendance.date);
  attDate.setHours(0, 0, 0, 0);

  if (attDate < today) {
    throw new AppError('Cannot cancel a leave in the past', 400);
  }

  if (!attendance.isOnLeave) {
    throw new AppError('This attendance record is not marked as leave', 400);
  }

  await attendance.deleteOne();
};
