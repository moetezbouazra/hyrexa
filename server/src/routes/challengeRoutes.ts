import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createChallenge,
  getChallenges,
  getChallenge,
  deleteChallenge,
} from '../controllers/challengeController';

const router = express.Router();

// Public routes
router.get('/', getChallenges);
router.get('/:id', getChallenge);

// Admin routes
router.post('/', authenticate, authorize('ADMIN'), createChallenge);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteChallenge);

export default router;
