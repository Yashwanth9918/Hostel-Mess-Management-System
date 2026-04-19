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
 * Get monthly attendance analytics for a hostel (single aggregation query).
 *
 * Returns:
 *  - daily[]   : per-day stats (date, present count, leave count, meal-wise counts, percentages)
 *  - weekday[] : weekday averages (Mon–Sun)
 *  - kpis      : overall month-level KPIs
 */
export const getMessMonthlyStats = async (user, hostelId, month, year) => {
  // Managers can only view their own hostel
  if (user.role === 'manager' && user.hostelId !== hostelId) {
    throw new AppError('You can only view attendance for your assigned hostel', 403);
  }

  const m = parseInt(month);
  const y = parseInt(year);
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999);

  // Single query: get ALL attendance records for this hostel for the whole month
  const records = await Attendance.find({
    hostelId,
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  // Group records by date (YYYY-MM-DD string)
  const byDate = {};
  for (const rec of records) {
    const dateKey = new Date(rec.date).toISOString().split('T')[0];
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(rec);
  }

  // Compute daily stats
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daily = [];
  let totalPresentPctSum = 0;
  let totalMealsPerStudentSum = 0;
  let totalLeaveDays = 0;
  let countedDays = 0;

  // Weekday accumulators
  const weekdayAgg = {}; // { Monday: { presentPctSum, mealsSum, count } }

  // Iterate over every day in the month
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    const dayRecords = byDate[dateKey] || [];
    if (dayRecords.length === 0) continue; // skip days with no records

    const totalStudents = dayRecords.length;
    const studentsOnLeave = dayRecords.filter((r) => r.isOnLeave).length;
    const studentsPresent = dayRecords.filter((r) => !r.isOnLeave && r.totalMealsPresent > 0).length;

    // Meal-wise counts (how many students were present for each meal)
    let breakfastCount = 0;
    let lunchCount = 0;
    let dinnerCount = 0;
    let totalMealsPresent = 0;

    for (const rec of dayRecords) {
      if (rec.isOnLeave) continue;
      totalMealsPresent += rec.totalMealsPresent || 0;
      if (rec.meals && Array.isArray(rec.meals)) {
        for (const meal of rec.meals) {
          if (meal.isPresent) {
            if (meal.mealType === 'breakfast') breakfastCount++;
            else if (meal.mealType === 'lunch') lunchCount++;
            else if (meal.mealType === 'dinner') dinnerCount++;
          }
        }
      }
    }

    const activeStudents = totalStudents - studentsOnLeave;
    const presentPct = totalStudents > 0 ? (studentsPresent / totalStudents) * 100 : 0;
    const avgMealsPerStudent = activeStudents > 0 ? totalMealsPresent / activeStudents : 0;

    const dayEntry = {
      date: dateKey,
      dayOfWeek: dayNames[new Date(d).getDay()],
      totalStudents,
      studentsPresent,
      studentsOnLeave,
      studentsAbsent: totalStudents - studentsPresent - studentsOnLeave,
      presentPct: Number(presentPct.toFixed(1)),
      avgMealsPerStudent: Number(avgMealsPerStudent.toFixed(2)),
      breakfastCount,
      lunchCount,
      dinnerCount,
    };

    daily.push(dayEntry);

    // Accumulate for weekday averages
    const wday = dayEntry.dayOfWeek;
    if (!weekdayAgg[wday]) weekdayAgg[wday] = { presentPctSum: 0, mealsSum: 0, breakfastSum: 0, lunchSum: 0, dinnerSum: 0, activeStudentsSum: 0, count: 0 };
    weekdayAgg[wday].presentPctSum += presentPct;
    weekdayAgg[wday].mealsSum += avgMealsPerStudent;
    weekdayAgg[wday].breakfastSum += activeStudents > 0 ? (breakfastCount / activeStudents) * 100 : 0;
    weekdayAgg[wday].lunchSum += activeStudents > 0 ? (lunchCount / activeStudents) * 100 : 0;
    weekdayAgg[wday].dinnerSum += activeStudents > 0 ? (dinnerCount / activeStudents) * 100 : 0;
    weekdayAgg[wday].count += 1;

    totalPresentPctSum += presentPct;
    totalMealsPerStudentSum += avgMealsPerStudent;
    totalLeaveDays += studentsOnLeave;
    countedDays++;
  }

  // Build weekday averages (Mon–Sun order)
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekday = weekdayOrder.map((day) => {
    const v = weekdayAgg[day];
    if (!v || v.count === 0) return { day, presentPct: 0, avgMealsPerStudent: 0, breakfastPct: 0, lunchPct: 0, dinnerPct: 0 };
    return {
      day,
      presentPct: Number((v.presentPctSum / v.count).toFixed(1)),
      avgMealsPerStudent: Number((v.mealsSum / v.count).toFixed(2)),
      breakfastPct: Number((v.breakfastSum / v.count).toFixed(1)),
      lunchPct: Number((v.lunchSum / v.count).toFixed(1)),
      dinnerPct: Number((v.dinnerSum / v.count).toFixed(1)),
    };
  });

  // Peak and low days
  let peakDay = null;
  let lowDay = null;
  for (const d of daily) {
    if (!peakDay || d.presentPct > peakDay.presentPct) peakDay = d;
    if (!lowDay || d.presentPct < lowDay.presentPct) lowDay = d;
  }

  // Meal popularity (total across the month)
  const totalBreakfast = daily.reduce((s, d) => s + d.breakfastCount, 0);
  const totalLunch = daily.reduce((s, d) => s + d.lunchCount, 0);
  const totalDinner = daily.reduce((s, d) => s + d.dinnerCount, 0);

  const kpis = {
    avgDailyPresencePct: countedDays ? Number((totalPresentPctSum / countedDays).toFixed(1)) : 0,
    avgMealsPerStudent: countedDays ? Number((totalMealsPerStudentSum / countedDays).toFixed(2)) : 0,
    totalLeaveDays,
    daysWithData: countedDays,
    peakDay: peakDay ? { date: peakDay.date, presentPct: peakDay.presentPct } : null,
    lowDay: lowDay ? { date: lowDay.date, presentPct: lowDay.presentPct } : null,
    mealTotals: { breakfast: totalBreakfast, lunch: totalLunch, dinner: totalDinner },
  };

  return { daily, weekday, kpis };
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
