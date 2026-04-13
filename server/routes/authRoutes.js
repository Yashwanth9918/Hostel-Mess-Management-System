import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { registerValidation, loginValidation, validate } from '../validators/authValidator.js';

const router = express.Router();

// ── Public routes ────────────────────────────────────────────────
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// ── Protected routes ─────────────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
