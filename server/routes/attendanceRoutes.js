import express from 'express';
import {
  markAttendance,
  registerLeave,
  getMyAttendance,
  getMonthlyAttendance,
  getAttendanceSummary,
  getMessAttendance,
  updateAttendance,
  deleteAttendance,
  cancelLeave,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Student routes
router.post('/', protect, authorize('student'), markAttendance);
router.post('/leave', protect, authorize('student'), registerLeave);
router.get('/my-attendance', protect, authorize('student'), getMyAttendance);
router.put('/cancel-leave/:id', protect, cancelLeave);

// Student, Manager, and Admin routes
router.get('/monthly/:month/:year', protect, getMonthlyAttendance);

// Manager and Admin only routes
router.get('/summary/:studentId/:month/:year', protect, authorize('manager', 'admin'), getAttendanceSummary);
router.get('/mess/:messId/:date', protect, authorize('manager', 'admin'), getMessAttendance);
router.put('/:id', protect, authorize('manager', 'admin'), updateAttendance);

// Admin only routes
router.delete('/:id', protect, authorize('admin'), deleteAttendance);

export default router;
