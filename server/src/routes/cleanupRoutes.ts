import { Router } from 'express';
import { body } from 'express-validator';
import {
  submitCleanup,
  getCleanupActivities,
  getCleanupById,
  verifyCleanupActivity,
} from '../controllers/cleanupController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

// Public routes
router.get('/', getCleanupActivities);
router.get('/:id', getCleanupById);

// Protected routes
router.post(
  '/',
  authenticate,
  uploadMultiple,
  [body('wasteReportId').notEmpty().withMessage('Waste report ID is required')],
  submitCleanup
);

router.post(
  '/:id/verify',
  authenticate,
  authorize('ADMIN'),
  [
    body('approved').isBoolean().withMessage('Approved must be true or false'),
    body('adminNotes').optional().isString(),
  ],
  verifyCleanupActivity
);

export default router;
