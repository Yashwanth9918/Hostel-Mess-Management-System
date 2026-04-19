import { body, validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

// ── Reusable validation runner ───────────────────────────────────
/**
 * Middleware that checks express-validator results.
 * If there are errors, throws an AppError(400) with all messages.
 * Place this AFTER the validation rules in the route chain.
 *
 * Usage in routes:
 *   router.post('/register', registerValidation, validate, controller);
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    throw new AppError(messages.join('. '), 400);
  }

  next();
};

// ── Registration validation rules ────────────────────────────────
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(['student', 'manager', 'admin'])
    .withMessage('Invalid role. Must be student, manager, or admin'),

  body('contactNumber')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Contact number must be a valid 10-digit number'),

  body('hostelId')
    .if(body('role').isIn(['student', 'manager']))
    .notEmpty()
    .withMessage('Hostel ID is required for students and managers')
    .isIn(['BH-1', 'BH-2', 'BH-3', 'BH-4', 'BH-5', 'GH-1', 'GH-2', 'GH-3'])
    .withMessage('Invalid hostel. Must be one of: BH-1, BH-2, BH-3, BH-4, BH-5, GH-1, GH-2, GH-3'),
];

// ── Login validation rules ───────────────────────────────────────
export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
