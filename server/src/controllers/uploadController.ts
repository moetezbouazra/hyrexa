import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { uploadProfileImage } from '../services/storageService.js';

/**
 * Upload a single file (generic)
 */
export const uploadFile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('No file provided', 400));
    }

    const { uploadFileToMinio } = await import('../services/storageService.js');
    const result = await uploadFileToMinio(req.file, 'uploads');

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: result,
    });
  }
);

/**
 * Upload multiple files
 */
export const uploadFiles = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next(new AppError('No files provided', 400));
    }

    const { uploadFilesToMinio } = await import('../services/storageService.js');
    const results = await uploadFilesToMinio(req.files, 'uploads');

    res.status(200).json({
      success: true,
      message: `${results.length} file(s) uploaded successfully`,
      data: results,
    });
  }
);

/**
 * Upload profile image
 */
export const uploadUserProfileImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('No file provided', 400));
    }

    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const result = await uploadProfileImage(req.file);

    // Update user profile image in database
    const prisma = (await import('../config/database.js')).default;
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { profileImage: result.url },
    });

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: result,
    });
  }
);

/**
 * View/Download a file from MinIO
 */
export const viewFile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { filename } = req.params;
    
    if (!filename) {
      return next(new AppError('Filename is required', 400));
    }

    const { getFileFromMinio } = await import('../services/storageService.js');
    const fileStream = await getFileFromMinio(filename);

    // Set appropriate content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
    };
    
    const contentType = contentTypes[extension || ''] || 'application/octet-stream';
    
    // Set CORS headers for images
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    fileStream.pipe(res);
  }
);
