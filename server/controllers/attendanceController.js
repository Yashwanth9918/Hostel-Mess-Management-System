import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// @desc    Mark daily attendance (create/update)
// @route   POST /api/attendance
// @access  Private (Student)
// export const markAttendance = async (req, res) => {
//   try {
//     const { date, meals, isOnLeave, leaveReason, leaveDescription } = req.body;
//     const studentId = req.user._id;
//     const messId = req.user.messId;

//     // Parse date to start of day
//     const attendanceDate = new Date(date);
//     attendanceDate.setHours(0, 0, 0, 0);

//     // Check if attendance already exists for this date
//     let attendance = await Attendance.findOne({
//       studentId,
//       date: attendanceDate,
//     });

//     if (attendance) {
//       // Update existing attendance
//       attendance.meals = meals || attendance.meals;
//       attendance.isOnLeave = isOnLeave !== undefined ? isOnLeave : attendance.isOnLeave;
//       attendance.leaveReason = leaveReason || attendance.leaveReason;
//       attendance.leaveDescription = leaveDescription || attendance.leaveDescription;
      
//       await attendance.save();

//       return res.status(200).json({
//         success: true,
//         message: 'Attendance updated successfully',
//         data: attendance,
//       });
//     }

//     // Create new attendance
//     attendance = await Attendance.create({
//       studentId,
//       messId,
//       date: attendanceDate,
//       meals: meals || [],
//       isOnLeave: isOnLeave || false,
//       leaveReason,
//       leaveDescription,
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Attendance marked successfully',
//       data: attendance,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while marking attendance',
//       error: error.message,
//     });
//   }
// };

// @desc    Register leave for multiple days
// @route   POST /api/attendance/leave
// @access  Private (Student)

// ======================
// Register Leave
// ======================
export const registerLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, description } = req.body;
    const studentId = req.user._id;
    const messId = req.user.messId;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Basic date validations
    if (end < start)
      return res.status(400).json({ success: false, message: "End date must be after start date" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today)
      return res.status(400).json({ success: false, message: "Cannot register leave for past dates" });

    // 👇 Will throw if overlaps/duplicates exist
    const attendanceRecords = await Attendance.registerLeave(
      studentId,
      messId,
      start,
      end,
      reason,
      description
    );

    res.status(201).json({
      success: true,
      message: `Leave registered successfully for ${attendanceRecords.length} days.`,
      data: attendanceRecords,
    });
  } catch (err) {
    console.error("Leave registration error:", err.message);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to register leave",
    });
  }
};



// ======================
// Mark Attendance
// ======================
export const markAttendance = async (req, res) => {
  try {
    const { date, meals, isOnLeave } = req.body;
    const studentId = req.user._id;
    const messId = req.user.messId;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ studentId, date: attendanceDate });

    // Disallow marking attendance during leave
    if (attendance && attendance.isOnLeave) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for a date that is marked as leave.',
      });
    }

    if (attendance) {
      attendance.meals = meals || attendance.meals;
      attendance.isOnLeave = isOnLeave ?? attendance.isOnLeave;
      await attendance.save();
      return res.status(200).json({ success: true, message: 'Attendance updated', data: attendance });
    }

    const newRecord = await Attendance.create({
      studentId,
      messId,
      date: attendanceDate,
      meals: meals || [],
      isOnLeave: isOnLeave || false,
    });

    res.status(201).json({ success: true, message: 'Attendance marked', data: newRecord });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while marking attendance',
      error: error.message,
    });
  }
};


// @desc    Get my attendance for date range
// @route   GET /api/attendance/my-attendance
// @access  Private (Student)
export const getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const studentId = req.user._id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate and endDate',
      });
    }

    const attendance = await Attendance.getAttendanceByDateRange(
      studentId,
      new Date(startDate),
      new Date(endDate)
    );

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance',
      error: error.message,
    });
  }
};

// @desc    Get monthly attendance for a student
// @route   GET /api/attendance/monthly/:month/:year
// @access  Private (Student - own data, Manager/Admin - any student)
export const getMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.params;
    const { studentId } = req.query;

    // Students can only view their own attendance
    let targetStudentId = req.user._id;
    
    if (studentId && (req.user.role === 'manager' || req.user.role === 'admin')) {
      targetStudentId = studentId;
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

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
      summary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly attendance',
      error: error.message,
    });
  }
};

// @desc    Get attendance summary for billing
// @route   GET /api/attendance/summary/:studentId/:month/:year
// @access  Private (Admin/Manager only)
export const getAttendanceSummary = async (req, res) => {
  try {
    const { studentId, month, year } = req.params;

    const summary = await Attendance.getAttendanceSummary(
      studentId,
      parseInt(month),
      parseInt(year)
    );

    const student = await User.findById(studentId).select('name email registrationNumber hostelId messId');

    res.status(200).json({
      success: true,
      student,
      summary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance summary',
      error: error.message,
    });
  }
};

// @desc    Get mess-wise attendance for a date
// @route   GET /api/attendance/mess/:messId/:date
// @access  Private (Manager/Admin only)
export const getMessAttendance = async (req, res) => {
  try {
    const { messId, date } = req.params;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view attendance for your assigned mess',
      });
    }

    const attendance = await Attendance.getMessAttendance(messId, new Date(date));

    // Calculate statistics
    const totalStudents = attendance.length;
    const studentsOnLeave = attendance.filter((a) => a.isOnLeave).length;
    const studentsPresent = attendance.filter((a) => !a.isOnLeave && a.totalMealsPresent > 0).length;

    res.status(200).json({
      success: true,
      count: attendance.length,
      statistics: {
        totalStudents,
        studentsPresent,
        studentsOnLeave,
        studentsAbsent: totalStudents - studentsPresent - studentsOnLeave,
      },
      data: attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching mess attendance',
      error: error.message,
    });
  }
};

// @desc    Update attendance (for managers/admin)
// @route   PUT /api/attendance/:id
// @access  Private (Manager/Admin only)
export const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== attendance.messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update attendance for your assigned mess',
      });
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('studentId', 'name registrationNumber');

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating attendance',
      error: error.message,
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Admin only)
export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting attendance',
      error: error.message,
    });
  }
};

// @desc    Cancel leave
// @route   PUT /api/attendance/cancel-leave/:id
// @access  Private (Student - own leave, Admin/Manager - any leave)
export const cancelLeave = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    // Students can only cancel their own leave
    if (req.user.role === 'student' && attendance.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave',
      });
    }

    // Only allow cancelling upcoming leaves (not past dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attDate = new Date(attendance.date);
    attDate.setHours(0, 0, 0, 0);

    if (attDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a leave in the past',
      });
    }

    // Ensure this record is a leave
    if (!attendance.isOnLeave) {
      return res.status(400).json({
        success: false,
        message: 'This attendance record is not marked as leave',
      });
    }

    // Delete the attendance document (remove leave entry)
    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Leave cancelled and record removed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling leave',
      error: error.message,
    });
  }
};
