import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../utils/errorHandler.js';
import { uploadFilesToMinio, getFileUrl } from '../services/storageService.js';
import { analyzeWasteImage } from '../services/aiAnalysisService.js';

/**
 * Create a new waste report
 */
export const createWasteReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { latitude, longitude, locationName, description, wasteType, severity, photos } = req.body;

    let photoKeys: string[] = [];
    let aiAnalysis: any = null;

    // Check if photos are provided as pre-uploaded keys (array of strings) or as files
    if (photos && Array.isArray(photos) && photos.length > 0) {
      // Photos already uploaded, use the provided keys
      photoKeys = photos;
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Upload photos to MinIO
      const uploadedPhotos = await uploadFilesToMinio(req.files, 'waste-reports');
      photoKeys = uploadedPhotos.map((photo) => photo.key);

      // Analyze first photo with AI
      const firstPhotoBuffer = req.files[0].buffer;
      aiAnalysis = await analyzeWasteImage(firstPhotoBuffer);
    } else {
      return next(new AppError('At least one photo is required', 400));
    }

    // Create waste report
    const wasteReport = await prisma.wasteReport.create({
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationName: locationName || '',
        description: description || '',
        wasteType,
        severity: parseInt(severity) || 3,
        photos: photoKeys,
        reporterId: req.user.userId,
        status: 'PENDING_REVIEW',
        aiAnalysisData: aiAnalysis as any,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Waste report created successfully',
      data: { wasteReport },
    });
  }
);

/**
 * Get all waste reports (with filters)
 */
export const getWasteReports = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      status,
      wasteType,
      minSeverity,
      maxSeverity,
      lat,
      lng,
      radius, // in km
      page = 1,
      limit = 20,
    } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (wasteType) where.wasteType = wasteType;
    if (minSeverity || maxSeverity) {
      where.severity = {};
      if (minSeverity) where.severity.gte = parseInt(minSeverity as string);
      if (maxSeverity) where.severity.lte = parseInt(maxSeverity as string);
    }

    // TODO: Implement geo-radius filtering with PostGIS or manual calculation

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [wasteReports, total] = await Promise.all([
      prisma.wasteReport.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              cleanupActivities: true,
            },
          },
        },
      }),
      prisma.wasteReport.count({ where }),
    ]);

    // Get presigned URLs for photos
    const reportsWithUrls = await Promise.all(
      wasteReports.map(async (report) => {
        const photoUrls = await Promise.all(
          report.photos.map((key) => getFileUrl(key))
        );
        return {
          ...report,
          photoUrls,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        wasteReports: reportsWithUrls,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / take),
        },
      },
    });
  }
);

/**
 * Get single waste report by ID
 */
export const getWasteReportById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const wasteReport = await prisma.wasteReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            carbonPoints: true,
          },
        },
        cleanupActivities: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wasteReport) {
      return next(new AppError('Waste report not found', 404));
    }

    // Get presigned URLs
    const photoUrls = await Promise.all(
      wasteReport.photos.map((key) => getFileUrl(key))
    );

    res.status(200).json({
      success: true,
      data: {
        wasteReport: {
          ...wasteReport,
          photoUrls,
        },
      },
    });
  }
);

/**
 * Update waste report status (Admin only)
 */
export const updateWasteReportStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Admin access required', 403));
    }

    const wasteReport = await prisma.wasteReport.update({
      where: { id },
      data: {
        status,
        adminNotes,
        ...(status === 'APPROVED' && { approvedAt: new Date() }),
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // TODO: Send notification to reporter

    res.status(200).json({
      success: true,
      message: 'Waste report status updated',
      data: { wasteReport },
    });
  }
);

/**
 * Delete waste report
 */
export const deleteWasteReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const wasteReport = await prisma.wasteReport.findUnique({
      where: { id },
    });

    if (!wasteReport) {
      return next(new AppError('Waste report not found', 404));
    }

    // Only reporter or admin can delete
    if (wasteReport.reporterId !== req.user.userId && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to delete this report', 403));
    }

    await prisma.wasteReport.delete({
      where: { id },
    });

    // TODO: Delete associated photos from MinIO

    res.status(200).json({
      success: true,
      message: 'Waste report deleted successfully',
    });
  }
);
