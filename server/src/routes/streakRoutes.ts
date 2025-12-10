import express from 'express';
import { authenticate } from '../middleware/auth';
import { getUserStreak, updateUserStreak } from '../controllers/streakController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's streak
router.get('/', getUserStreak);

// Update user's streak (called after activity)
router.post('/update', updateUserStreak);

export default router;
