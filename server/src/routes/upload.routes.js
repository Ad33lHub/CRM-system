import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { validateFileType } from '../middleware/fileValidation.middleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  uploadFile,
  deleteFile,
  getUploads,
  uploadProfileImage,
} from '../controllers/upload.controller.js';

const router = Router();

router.post(
  '/',
  verifyToken,
  uploadLimiter,
  uploadSingle('file', 'default'),
  validateFileType(['images', 'documents', 'archives']),
  uploadFile
);

router.post(
  '/profile',
  verifyToken,
  uploadLimiter,
  uploadSingle('avatar', 'profileImage'),
  validateFileType(['images']),
  uploadProfileImage
);

router.delete('/:publicId(*)', verifyToken, deleteFile);

router.get('/', verifyToken, getUploads);

export default router;
