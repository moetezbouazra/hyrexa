import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../utils/errorHandler.js';
import { uploadFilesToMinio, getFileUrl } from '../services/storageService.js';
import { verifyCleanup, calculateCarbonPoints } from '../services/aiAnalysisService.js';
import axios from 'axios';

/**
 * Submit cleanup activity
 */
export const submitCleanup = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next(new AppError('After photos are required', 400));
    }

    const { wasteReportId } = req.body;

    // Verify waste report exists and is approved
    const wasteReport = await prisma.wasteReport.findUnique({
      where: { id: wasteReportId },
    });

    if (!wasteReport) {
      return next(new AppError('Waste report not found', 404));
    }

    if (wasteReport.status !== 'APPROVED') {
      return next(new AppError('Waste report must be approved before cleanup submission', 400));
    }

    // Upload after photos
    const uploadedPhotos = await uploadFilesToMinio(req.files, 'cleanups');
    const afterPhotoKeys = uploadedPhotos.map((photo) => photo.key);

    // Create cleanup activity
    const cleanupActivity = await prisma.cleanupActivity.create({
      data: {
        wasteReportId,
        userId: req.user.userId,
        beforePhotos: wasteReport.photos,
        afterPhotos: afterPhotoKeys,
        status: 'PENDING_VERIFICATION',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        wasteReport: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            wasteType: true,
            severity: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Cleanup submitted for verification',
      data: { cleanupActivity },
    });
  }
);

/**
 * Get all cleanup activities
 */
export const getCleanupActivities = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, userId, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [activities, total] = await Promise.all([
      prisma.cleanupActivity.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
          wasteReport: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
              locationName: true,
              wasteType: true,
              severity: true,
            },
          },
        },
      }),
      prisma.cleanupActivity.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          pages: Math.ceil(total / take),
        },
      },
    });
  }
);

/**
 * Get single cleanup activity
 */
export const getCleanupById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const cleanup = await prisma.cleanupActivity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            carbonPoints: true,
          },
        },
        wasteReport: true,
      },
    });

    if (!cleanup) {
      return next(new AppError('Cleanup activity not found', 404));
    }

    // Get presigned URLs for photos
    const beforePhotoUrls = await Promise.all(
      cleanup.beforePhotos.map((key) => getFileUrl(key))
    );
    const afterPhotoUrls = await Promise.all(
      cleanup.afterPhotos.map((key) => getFileUrl(key))
    );

    res.status(200).json({
      success: true,
      data: {
        cleanup: {
          ...cleanup,
          beforePhotoUrls,
          afterPhotoUrls,
        },
      },
    });
  }
);

/**
 * Verify cleanup (Admin only)
 */
export const verifyCleanupActivity = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { approved, adminNotes } = req.body;

    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Admin access required', 403));
    }

    const cleanup = await prisma.cleanupActivity.findUnique({
      where: { id },
      include: {
        wasteReport: true,
        user: true,
      },
    });

    if (!cleanup) {
      return next(new AppError('Cleanup activity not found', 404));
    }

    let pointsAwarded = 0;
    let aiAnalysis = null;

    if (approved) {
      // Fetch before and after images for AI verification
      try {
        const beforeImageUrl = await getFileUrl(cleanup.beforePhotos[0]);
        const afterImageUrl = await getFileUrl(cleanup.afterPhotos[0]);

        const [beforeResponse, afterResponse] = await Promise.all([
          axios.get(beforeImageUrl, { responseType: 'arraybuffer' }),
          axios.get(afterImageUrl, { responseType: 'arraybuffer' }),
        ]);

        const beforeBuffer = Buffer.from(beforeResponse.data);
        const afterBuffer = Buffer.from(afterResponse.data);

        const verification = await verifyCleanup(beforeBuffer, afterBuffer);
        
        pointsAwarded = calculateCarbonPoints(
          cleanup.wasteReport.severity,
          verification.objectsRemoved,
          verification.confidence
        );

        aiAnalysis = verification;
      } catch (error) {
        // If AI verification fails, award minimum points
        pointsAwarded = 10;
      }

      // Update user's carbon points
      await prisma.user.update({
        where: { id: cleanup.userId },
        data: {
          carbonPoints: {
            increment: pointsAwarded,
          },
        },
      });

      // Update waste report status
      await prisma.wasteReport.update({
        where: { id: cleanup.wasteReportId },
        data: { status: 'CLEANED' },
      });
    }

    // Update cleanup activity
    const updatedCleanup = await prisma.cleanupActivity.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        pointsAwarded,
        aiConfidenceScore: aiAnalysis?.confidence,
        aiAnalysisData: aiAnalysis as any,
        adminNotes,
        verifiedAt: approved ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            carbonPoints: true,
          },
        },
      },
    });

    // TODO: Send notification to user
    // TODO: Check for achievement unlocks

    res.status(200).json({
      success: true,
      message: approved ? 'Cleanup verified and points awarded' : 'Cleanup rejected',
      data: { cleanup: updatedCleanup },
    });
  }
);
