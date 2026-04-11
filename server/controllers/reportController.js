import User from "../models/User.js";
import Feedback from "../models/Feedback.js";
import Bill from "../models/Bill.js";
import Attendance from "../models/Attendance.js";

// @desc System-wide summary stats
// @route GET /api/reports/system
// @access Admin
export const getSystemReport = async (req, res) => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    // Build month range
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // 1️⃣ Total students
    const totalStudents = await User.countDocuments({ role: "student" });

    // 2️⃣ Average meal rating
    const ratingAgg = await Feedback.aggregate([
      {
        $match: { date: { $gte: startOfMonth, $lte: endOfMonth } },
      },
      {
        $group: { _id: null, avgRating: { $avg: "$overallRating" } },
      },
    ]);
    const avgMealRating = ratingAgg.length ? ratingAgg[0].avgRating : 0;

    // 3️⃣ Monthly revenue
    const revenueAgg = await Bill.aggregate([
      {
        $match: {
          month,
          year,
          paymentStatus: "paid",
        },
      },
      {
        $group: { _id: null, total: { $sum: "$totalAmount" } },
      },
    ]);
    const monthlyRevenue = revenueAgg.length ? revenueAgg[0].total : 0;

    // 4️⃣ Attendance rate
    const attendanceAgg = await Attendance.aggregate([
      {
        $match: { month, year },
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: "$totalDays" },
          presentDays: { $sum: "$daysPresent" },
        },
      },
    ]);

    const attendanceRate =
      attendanceAgg.length && attendanceAgg[0].totalDays > 0
        ? (attendanceAgg[0].presentDays / attendanceAgg[0].totalDays) * 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        avgMealRating,
        monthlyRevenue,
        attendanceRate,
      },
    });
  } catch (error) {
    console.error("Error generating system report:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating system report",
      error: error.message,
    });
  }
};
