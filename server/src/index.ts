import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { errorHandler } from './utils/errorHandler.js';
import { initializeBucket } from './config/minio.js';

// Load environment variables
dotenv.config();

// Initialize MinIO bucket
initializeBucket().catch((err) => {
  logger.error('Failed to initialize MinIO:', err);
});

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    message: 'Hyrexa API is running',
    timestamp: new Date().toISOString(),
  });
});

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import wasteReportRoutes from './routes/wasteReportRoutes.js';
import cleanupRoutes from './routes/cleanupRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import streakRoutes from './routes/streakRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/waste-reports', wasteReportRoutes);
app.use('/api/cleanups', cleanupRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/challenges', challengeRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Hyrexa API server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

export default app;
