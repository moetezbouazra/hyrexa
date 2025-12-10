import { Router } from 'express';
import {
  getUserProfile,
  getLeaderboard,
  updateProfile,
  getUserStats,
  getUserActivities,
  getUserAchievements,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/profile/:username', getUserProfile);
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.get('/me/stats', authenticate, getUserStats);
router.get('/me/activities', authenticate, getUserActivities);
router.get('/me/achievements', authenticate, getUserAchievements);
router.patch('/profile', authenticate, updateProfile);

export default router;
