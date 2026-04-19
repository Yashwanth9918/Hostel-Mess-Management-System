import express from 'express';
import {
  markAttendance,
  registerLeave,
  getMyAttendance,
  getMonthlyAttendance,
  getAttendanceSummary,
  getMessAttendance,
  getMessMonthlyAttendance,
  updateAttendance,
  deleteAttendance,
  cancelLeave,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  markAttendanceValidation,
  registerLeaveValidation,
  getMyAttendanceValidation,
  monthlyAttendanceValidation,
} from '../validators/attendanceValidator.js';

const router = express.Router();

// ── Student routes ───────────────────────────────────────────────
// NOTE: Manual attendance marking (POST /) removed — students now
// scan QR codes via /api/meal-tokens/scan to mark attendance.
router.post('/leave', protect, authorize('student'), registerLeaveValidation, validate, registerLeave);
router.get('/my-attendance', protect, authorize('student'), getMyAttendanceValidation, validate, getMyAttendance);
router.put('/cancel-leave/:id', protect, cancelLeave);

// ── Student, Manager, and Admin routes ───────────────────────────
router.get('/monthly/:month/:year', protect, monthlyAttendanceValidation, validate, getMonthlyAttendance);

// ── Manager and Admin only routes ────────────────────────────────
router.get('/summary/:studentId/:month/:year', protect, authorize('manager', 'admin'), getAttendanceSummary);
router.get('/mess/:hostelId/:date', protect, authorize('manager', 'admin'), getMessAttendance);
router.get('/mess-monthly/:hostelId/:month/:year', protect, authorize('manager', 'admin'), getMessMonthlyAttendance);
router.put('/:id', protect, authorize('manager', 'admin'), updateAttendance);

// ── Admin only routes ────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), deleteAttendance);

export default router;
