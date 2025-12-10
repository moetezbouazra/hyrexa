import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', getNotifications);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all as read
router.patch('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

export default router;
