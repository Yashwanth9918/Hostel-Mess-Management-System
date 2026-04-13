import { body, param } from 'express-validator';

// ── Create menu validation ───────────────────────────────────────
export const createMenuValidation = [
  body('messId')
    .notEmpty()
    .withMessage('Mess ID is required'),

  body('weekStartDate')
    .notEmpty()
    .withMessage('Week start date is required')
    .isISO8601()
    .withMessage('Week start date must be a valid date'),

  body('weekEndDate')
    .notEmpty()
    .withMessage('Week end date is required')
    .isISO8601()
    .withMessage('Week end date must be a valid date'),

  body('dailyMenus')
    .isArray({ min: 1 })
    .withMessage('Daily menus must be a non-empty array'),

  body('weekNumber')
    .optional()
    .isInt({ min: 1, max: 53 })
    .withMessage('Week number must be between 1 and 53'),

  body('year')
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year'),

  body('announcement')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Announcement cannot exceed 1000 characters'),
];

// ── Update menu validation ───────────────────────────────────────
export const updateMenuValidation = [
  body('dailyMenus')
    .optional()
    .isArray()
    .withMessage('Daily menus must be an array'),

  body('announcement')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Announcement cannot exceed 1000 characters'),
];
