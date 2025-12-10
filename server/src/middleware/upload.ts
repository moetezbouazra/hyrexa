import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AppError } from '../utils/errorHandler.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (jpeg, jpg, png, webp) are allowed', 400));
  }
};

// Single file upload (accepts 'file' or 'image' field name)
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
}).single('file');

// Single file upload with 'image' field name (for backward compatibility)
export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
}).single('image');

// Multiple files upload
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Max 5 files
  },
}).array('images', 5);

// Optional multiple files upload (doesn't require files)
export const uploadMultipleOptional = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Max 5 files
  },
}).array('images', 5);

// Generate unique filename
export const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const randomString = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomString}${ext}`;
};
