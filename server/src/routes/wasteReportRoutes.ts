import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import {
  createWasteReport,
  getWasteReports,
  getWasteReportById,
  updateWasteReportStatus,
  deleteWasteReport,
} from '../controllers/wasteReportController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMultipleOptional } from '../middleware/upload.js';

const router = Router();

// Public routes
router.get('/', getWasteReports);
router.get('/:id', getWasteReportById);

// Protected routes
router.post(
  '/',
  authenticate,
  uploadMultipleOptional,
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('wasteType').isIn([
      'PLASTIC_BOTTLES',
      'PLASTIC_BAGS',
      'MIXED_PLASTIC',
      'STYROFOAM',
      'FISHING_GEAR',
      'OTHER',
    ]).withMessage('Invalid waste type'),
    body('severity').optional().isInt({ min: 1, max: 5 }).withMessage('Severity must be 1-5'),
  ],
  createWasteReport
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  [
    body('status').isIn([
      'PENDING_REVIEW',
      'APPROVED',
      'REJECTED',
      'CLEANED',
    ]).withMessage('Invalid status'),
  ],
  updateWasteReportStatus
);

// Convenience routes for approve/reject
router.patch('/:id/approve', authenticate, authorize('ADMIN'), async (req, res, next) => {
  req.body.status = 'APPROVED';
  return updateWasteReportStatus(req, res, next);
});

router.patch('/:id/reject', authenticate, authorize('ADMIN'), async (req, res, next) => {
  req.body.status = 'REJECTED';
  return updateWasteReportStatus(req, res, next);
});

router.delete('/:id', authenticate, deleteWasteReport);

export default router;
