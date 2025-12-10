import { Client } from 'minio';
import logger from './logger.js';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9090'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'hyrexa_admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'hyrexa_minio_password',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'hyrexa-uploads';

// Initialize bucket
export const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`✓ MinIO bucket '${BUCKET_NAME}' created successfully`);
      
      // Set bucket policy to allow public read for profile images
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/public/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      logger.info('✓ MinIO bucket policy set successfully');
    } else {
      logger.info(`✓ MinIO bucket '${BUCKET_NAME}' already exists`);
    }
  } catch (error: any) {
    logger.error('Failed to initialize MinIO bucket:', error);
    throw error;
  }
};

export { minioClient, BUCKET_NAME };
