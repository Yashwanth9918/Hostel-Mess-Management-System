import { body, param } from 'express-validator';

// ── Generate token validation ────────────────────────────────────
export const generateTokenValidation = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('mealType')
    .notEmpty()
    .withMessage('Meal type is required')
    .isIn(['breakfast', 'lunch', 'dinner'])
    .withMessage('Meal type must be breakfast, lunch, or dinner'),
];

// ── Scan token validation ────────────────────────────────────────
export const scanTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isString()
    .withMessage('Token must be a string'),
];

// ── Get tokens validation ────────────────────────────────────────
export const getTokensValidation = [
  param('hostelId')
    .notEmpty()
    .withMessage('Hostel ID is required'),

  param('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),
];
