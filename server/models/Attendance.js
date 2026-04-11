import mongoose from 'mongoose';

// =======================
// SUB-SCHEMA
// =======================
const MealAttendanceSchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'eveningSnacks', 'dinner'],
      required: true,
    },
    isPresent: {
      type: Boolean,
      default: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: String,
      enum: ['student', 'manager', 'system'],
      default: 'student',
    },
  },
  { _id: false }
);

// =======================
// MAIN SCHEMA
// =======================
const AttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    messId: {
      type: String,
      required: [true, 'Mess ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    meals: {
      type: [MealAttendanceSchema],
      default: [],
    },
    isOnLeave: {
      type: Boolean,
      default: false,
    },
    leaveReason: {
      type: String,
      enum: ['vacation', 'sick_leave', 'home_visit', 'emergency', 'other'],
    },
    leaveDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Leave description cannot exceed 500 characters'],
    },
    leaveStartDate: {
      type: Date,
    },
    leaveEndDate: {
      type: Date,
    },
    totalMealsPresent: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    totalMealsAbsent: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// =======================
// INDEXES
// =======================
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ messId: 1, date: 1 });
AttendanceSchema.index({ studentId: 1, date: 1, messId: 1 });
AttendanceSchema.index({ date: 1, isOnLeave: 1 });

// =======================
// MIDDLEWARES
// =======================
AttendanceSchema.pre('save', function (next) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  this.dayOfWeek = days[new Date(this.date).getDay()];

  if (this.isOnLeave) {
    this.totalMealsPresent = 0;
    this.totalMealsAbsent = 4;
    this.meals = [];
  } else {
    this.totalMealsPresent = this.meals.filter((m) => m.isPresent).length;
    this.totalMealsAbsent = this.meals.filter((m) => !m.isPresent).length;
  }

  next();
});

AttendanceSchema.pre('save', function (next) {
  if (this.isOnLeave && this.leaveStartDate && this.leaveEndDate && this.leaveEndDate < this.leaveStartDate) {
    return next(new Error('Leave end date must be after start date'));
  }
  next();
});

// =======================
// METHODS
// =======================
AttendanceSchema.methods.markMealAttendance = function (mealType, isPresent, markedBy = 'student') {
  const existing = this.meals.find((m) => m.mealType === mealType);
  if (existing) {
    existing.isPresent = isPresent;
    existing.markedAt = new Date();
    existing.markedBy = markedBy;
  } else {
    this.meals.push({ mealType, isPresent, markedAt: new Date(), markedBy });
  }
};

// =======================
// STATIC METHODS
// =======================

// 1️⃣ Date range attendance
AttendanceSchema.statics.getAttendanceByDateRange = async function (studentId, startDate, endDate) {
  return await this.find({
    studentId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

// 2️⃣ Monthly attendance
AttendanceSchema.statics.getMonthlyAttendance = async function (studentId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return await this.find({
    studentId,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 })
    .populate('studentId', 'name email registrationNumber');
};

// 3️⃣ Monthly summary
AttendanceSchema.statics.getAttendanceSummary = async function (studentId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const records = await this.find({
    studentId,
    date: { $gte: startDate, $lte: endDate },
  });

  let totalDays = records.length;
  let presentDays = 0,
    absentDays = 0,
    totalMealsPresent = 0,
    totalMealsAbsent = 0;

  records.forEach((r) => {
    if (r.isOnLeave || r.totalMealsPresent === 0) absentDays++;
    else presentDays++;
    totalMealsPresent += r.totalMealsPresent;
    totalMealsAbsent += r.totalMealsAbsent;
  });

  return {
    totalDays,
    presentDays,
    absentDays,
    totalMealsPresent,
    totalMealsAbsent,
    attendancePercentage: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0,
  };
};

// 4️⃣ Improved leave registration with overlap validation
AttendanceSchema.statics.registerLeave = async function (
  studentId,
  messId,
  startDate,
  endDate,
  reason,
  description
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 1️⃣ Basic range check
  if (end < start) {
    throw new Error("Leave end date must be after start date");
  }

  // 2️⃣ Find overlapping leave records
  const overlaps = await this.find({
    studentId,
    isOnLeave: true,
    $or: [
      { leaveStartDate: { $lte: end }, leaveEndDate: { $gte: start } },
      { date: { $gte: start, $lte: end } },
    ],
  });

  if (overlaps.length > 0) {
    const overlapDates = overlaps.map((r) => r.date.toDateString());
    throw new Error(`Overlapping leave already exists on: ${overlapDates.join(", ")}`);
  }

  // 3️⃣ Prevent duplicate single-day leaves
  const duplicate = await this.find({
    studentId,
    isOnLeave: true,
    date: { $gte: start, $lte: end },
  });

  if (duplicate.length > 0) {
    const dupDates = duplicate.map((r) => r.date.toDateString());
    throw new Error(`Leave already registered for: ${dupDates.join(", ")}`);
  }

  // 4️⃣ Create new leave records safely (no shared reference mutation)
  const attendanceRecords = [];
  for (
    let d = new Date(start.getTime());
    d <= end;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    const dateOnly = new Date(d);
    dateOnly.setHours(0, 0, 0, 0);

    const existing = await this.findOne({ studentId, date: dateOnly });
    if (existing && existing.isOnLeave) {
      throw new Error(`Leave already marked for ${dateOnly.toDateString()}`);
    }

    const record =
      existing ||
      new this({
        studentId,
        messId,
        date: dateOnly,
      });

    record.isOnLeave = true;
    record.leaveReason = reason;
    record.leaveDescription = description;
    record.leaveStartDate = start;
    record.leaveEndDate = end;

    await record.save();
    attendanceRecords.push(record);
  }

  return attendanceRecords;
};



// 5️⃣ Mess-wise attendance
AttendanceSchema.statics.getMessAttendance = async function (messId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return await this.find({
    messId,
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate('studentId', 'name registrationNumber hostelId')
    .sort({ studentId: 1 });
};

export default mongoose.model('Attendance', AttendanceSchema);
