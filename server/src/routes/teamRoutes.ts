import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTeam,
  getTeams,
  getTeam,
  joinTeam,
  leaveTeam,
  getTeamLeaderboard,
} from '../controllers/teamController';

const router = express.Router();

// Public routes
router.get('/', getTeams);
router.get('/leaderboard', getTeamLeaderboard);
router.get('/:id', getTeam);

// Protected routes
router.post('/', authenticate, createTeam);
router.post('/:id/join', authenticate, joinTeam);
router.post('/:id/leave', authenticate, leaveTeam);

export default router;
