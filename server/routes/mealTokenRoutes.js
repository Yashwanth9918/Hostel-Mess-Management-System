import express from 'express';
import {
  generateToken,
  getTokensForDate,
  scanToken,
  deactivateToken,
} from '../controllers/mealTokenController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  generateTokenValidation,
  scanTokenValidation,
  getTokensValidation,
} from '../validators/mealTokenValidator.js';

const router = express.Router();

// ── Manager/Admin routes ─────────────────────────────────────────
router.post(
  '/generate',
  protect,
  authorize('manager', 'admin'),
  generateTokenValidation,
  validate,
  generateToken
);

router.get(
  '/:hostelId/:date',
  protect,
  authorize('manager', 'admin'),
  getTokensValidation,
  validate,
  getTokensForDate
);

router.put(
  '/:id/deactivate',
  protect,
  authorize('manager', 'admin'),
  deactivateToken
);

// ── Student routes ───────────────────────────────────────────────
router.post(
  '/scan',
  protect,
  authorize('student'),
  scanTokenValidation,
  validate,
  scanToken
);

export default router;
