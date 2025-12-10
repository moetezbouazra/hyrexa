import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  googleAuth,
  getMe,
  changePassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Email/password registration
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  register
);

// Email/password login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Google OAuth
router.post('/google', googleAuth);

// Get current user (protected route)
router.get('/me', authenticate, getMe);

// Change password (protected route)
router.patch('/change-password', authenticate, changePassword);

export default router;
