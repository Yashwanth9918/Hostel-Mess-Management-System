import express from 'express';
import {
  generateBill,
  generateAllBills,
  getMyBills,
  getBillById,
  getMessBills,
  getUnpaidBills,
  getOverdueBills,
  addPayment,
  applyDiscount,
  applyLateFee,
  cancelBill,
  getBillingSummary,
  autoApplyLateFees,
  updateBill,
  getStudentsCount,
  getAllBillsStats,
  markBillsAsPaid,
} from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  generateBillValidation,
  generateAllBillsValidation,
  addPaymentValidation,
  applyDiscountValidation,
  applyLateFeeValidation,
  markBillsPaidValidation,
  billingSummaryValidation,
} from '../validators/billValidator.js';

const router = express.Router();

// ── Student routes ───────────────────────────────────────────────
router.get('/my-bills', protect, authorize('student'), getMyBills);
router.put('/mark-paid', protect, markBillsPaidValidation, validate, markBillsAsPaid);

// ── Manager and Admin routes ─────────────────────────────────────
router.get('/stats-all', protect, authorize('admin'), getAllBillsStats);
router.get('/stats-all/:month/:year', protect, authorize('admin'), getAllBillsStats);
router.get('/mess/:messId', protect, authorize('manager', 'admin'), getMessBills);
router.get('/unpaid/:messId', protect, authorize('manager', 'admin'), getUnpaidBills);
router.get('/overdue/:messId', protect, authorize('manager', 'admin'), getOverdueBills);
router.get('/summary/:messId/:month/:year', protect, authorize('manager', 'admin'), billingSummaryValidation, validate, getBillingSummary);
router.post('/:id/payment', protect, authorize('manager', 'admin'), addPaymentValidation, validate, addPayment);
router.get('/students-count', protect, authorize('admin'), getStudentsCount);

// ── Admin only routes ────────────────────────────────────────────
router.post('/generate', protect, authorize('admin'), generateBillValidation, validate, generateBill);
router.post('/generate-all', protect, authorize('admin'), generateAllBillsValidation, validate, generateAllBills);
router.put('/:id/discount', protect, authorize('admin'), applyDiscountValidation, validate, applyDiscount);
router.put('/:id/late-fee', protect, authorize('admin'), applyLateFeeValidation, validate, applyLateFee);
router.put('/:id/cancel', protect, authorize('admin'), cancelBill);
router.post('/apply-late-fees', protect, authorize('admin'), autoApplyLateFees);
router.put('/:id', protect, authorize('admin'), updateBill);

// ── All authenticated users ──────────────────────────────────────
router.get('/:id', protect, getBillById);

export default router;
