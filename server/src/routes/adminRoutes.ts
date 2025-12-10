import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAdminStats,
  approveWasteReport,
  rejectWasteReport,
  verifyCleanup,
  rejectCleanup,
  getAllUsers,
  updateUserRole,
} from '../controllers/adminController';

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Admin statistics
router.get('/stats', getAdminStats);

// Waste report management
router.patch('/waste-reports/:id/approve', approveWasteReport);
router.patch('/waste-reports/:id/reject', rejectWasteReport);

// Cleanup management
router.patch('/cleanups/:id/verify', verifyCleanup);
router.patch('/cleanups/:id/reject', rejectCleanup);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);

export default router;
