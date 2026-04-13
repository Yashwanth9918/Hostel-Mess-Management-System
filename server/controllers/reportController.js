import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import Bill from '../models/Bill.js';
import Attendance from '../models/Attendance.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Report Controller
 *
 * System-wide analytics and statistics.
 */

// @desc    System-wide summary stats
// @route   GET /api/reports/system
// @access  Admin
export const getSystemReport = asyncHandler(async (req, res) => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  // Run all queries in parallel for better performance
  const [totalStudents, ratingAgg, revenueAgg, attendanceAgg] = await Promise.all([
    User.countDocuments({ role: 'student' }),

    Feedback.aggregate([
      { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, avgRating: { $avg: '$overallRating' } } },
    ]),

    Bill.aggregate([
      { $match: { month, year, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),

    Attendance.aggregate([
      { $match: { month, year } },
      {
        $group: {
          _id: null,
          totalDays: { $sum: '$totalDays' },
          presentDays: { $sum: '$daysPresent' },
        },
      },
    ]),
  ]);

  const avgMealRating = ratingAgg.length ? ratingAgg[0].avgRating : 0;
  const monthlyRevenue = revenueAgg.length ? revenueAgg[0].total : 0;
  const attendanceRate =
    attendanceAgg.length && attendanceAgg[0].totalDays > 0
      ? (attendanceAgg[0].presentDays / attendanceAgg[0].totalDays) * 100
      : 0;

  sendSuccess(res, {
    totalStudents,
    avgMealRating,
    monthlyRevenue,
    attendanceRate,
  });
});
