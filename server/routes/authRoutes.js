import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation middleware for registration
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['student', 'manager', 'admin'])
    .withMessage('Invalid role'),
  body('messId')
    .if(body('role').isIn(['student', 'manager']))
    .notEmpty()
    .withMessage('Mess ID is required for students and managers'),
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);


router.post('/logout', protect, logout);

export default router;
