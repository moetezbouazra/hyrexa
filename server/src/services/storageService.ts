import { minioClient, BUCKET_NAME } from '../config/minio.js';
import sharp from 'sharp';
import { generateFileName } from '../middleware/upload.js';
import logger from '../config/logger.js';

export interface UploadedFile {
  url: string;
  key: string;
  size: number;
}

/**
 * Upload a single file to MinIO
 */
export const uploadFileToMinio = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<UploadedFile> => {
  try {
    // Optimize image with sharp
    const optimizedBuffer = await sharp(file.buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const fileName = generateFileName(file.originalname);
    const objectKey = `${folder}/${fileName}`;

    // Upload to MinIO
    await minioClient.putObject(
      BUCKET_NAME,
      objectKey,
      optimizedBuffer,
      optimizedBuffer.length,
      {
        'Content-Type': file.mimetype,
      }
    );

    const url = await getFileUrl(objectKey);

    logger.info(`File uploaded successfully: ${objectKey}`);

    return {
      url,
      key: objectKey,
      size: optimizedBuffer.length,
    };
  } catch (error: any) {
    logger.error('MinIO upload error:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Upload multiple files to MinIO
 */
export const uploadFilesToMinio = async (
  files: Express.Multer.File[],
  folder: string = 'uploads'
): Promise<UploadedFile[]> => {
  const uploadPromises = files.map((file) => uploadFileToMinio(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Get URL for a file (returns API endpoint for viewing)
 */
export const getFileUrl = async (objectKey: string): Promise<string> => {
  try {
    // Return API endpoint URL instead of presigned MinIO URL
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/api/upload/view/${objectKey}`;
  } catch (error: any) {
    logger.error('Error generating file URL:', error);
    throw new Error('Failed to generate file URL');
  }
};

/**
 * Delete a file from MinIO
 */
export const deleteFileFromMinio = async (objectKey: string): Promise<void> => {
  try {
    await minioClient.removeObject(BUCKET_NAME, objectKey);
    logger.info(`File deleted successfully: ${objectKey}`);
  } catch (error: any) {
    logger.error('MinIO delete error:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Delete multiple files from MinIO
 */
export const deleteFilesFromMinio = async (
  objectKeys: string[]
): Promise<void> => {
  const deletePromises = objectKeys.map((key) => deleteFileFromMinio(key));
  await Promise.all(deletePromises);
};

/**
 * Upload profile image with thumbnail
 */
export const uploadProfileImage = async (
  file: Express.Multer.File
): Promise<UploadedFile> => {
  try {
    // Create optimized profile image (square, 400x400)
    const optimizedBuffer = await sharp(file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    const fileName = generateFileName(file.originalname);
    const objectKey = `public/profiles/${fileName}`;

    await minioClient.putObject(
      BUCKET_NAME,
      objectKey,
      optimizedBuffer,
      optimizedBuffer.length,
      {
        'Content-Type': 'image/jpeg',
      }
    );

    const url = await getFileUrl(objectKey);

    logger.info(`Profile image uploaded successfully: ${objectKey}`);

    return {
      url,
      key: objectKey,
      size: optimizedBuffer.length,
    };
  } catch (error: any) {
    logger.error('Profile image upload error:', error);
    throw new Error('Failed to upload profile image');
  }
};

/**
 * Get file stream from MinIO for viewing/downloading
 */
export const getFileFromMinio = async (filename: string): Promise<any> => {
  try {
    // Check if file exists
    await minioClient.statObject(BUCKET_NAME, filename);
    
    // Get file stream
    const stream = await minioClient.getObject(BUCKET_NAME, filename);
    
    logger.info(`File retrieved successfully: ${filename}`);
    return stream;
  } catch (error: any) {
    logger.error('MinIO get file error:', error);
    throw new Error('File not found');
  }
};
