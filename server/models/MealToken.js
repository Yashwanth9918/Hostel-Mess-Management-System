import mongoose from 'mongoose';

// =======================
// MEAL TOKEN MODEL
// =======================
// Each document represents a unique QR token for one meal on one day
// in one hostel. The manager generates these; students scan the QR to
// mark attendance.

const MealTokenSchema = new mongoose.Schema(
  {
    hostelId: {
      type: String,
      required: [true, 'Hostel ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: [true, 'Meal type is required'],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One token per meal per day per hostel
MealTokenSchema.index({ hostelId: 1, date: 1, mealType: 1 }, { unique: true });

export default mongoose.model('MealToken', MealTokenSchema);
