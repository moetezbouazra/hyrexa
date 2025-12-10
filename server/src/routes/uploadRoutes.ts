import { Router } from 'express';
import {
  uploadFile,
  uploadFiles,
  uploadUserProfileImage,
  viewFile,
} from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';

const router = Router();

// View/download file (public route)
router.get('/view/:filename(*)', viewFile);

// All upload routes require authentication
router.use(authenticate);

// Upload single file (default route for backward compatibility)
router.post('/', uploadSingle, uploadFile);

// Upload single file
router.post('/single', uploadSingle, uploadFile);

// Upload multiple files
router.post('/multiple', uploadMultiple, uploadFiles);

// Upload profile image
router.post('/profile-image', uploadSingle, uploadUserProfileImage);

export default router;
