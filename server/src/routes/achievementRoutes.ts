import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAchievements,
  getUserAchievements,
  createAchievement,
} from '../controllers/achievementController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getAchievements);
router.get('/user/:userId', getUserAchievements);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('icon').notEmpty().withMessage('Icon is required'),
    body('requiredPoints').isInt({ min: 0 }).withMessage('Required points must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  createAchievement
);

export default router;
