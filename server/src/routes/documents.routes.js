import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { validateFileType } from '../middleware/fileValidation.middleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
} from '../controllers/documents.controller.js';

const router = Router();

router.post(
  '/',
  verifyToken,
  uploadLimiter,
  uploadSingle('document', 'document'),
  validateFileType(['documents', 'images']),
  uploadDocument
);

router.get('/', verifyToken, getDocuments);
router.get('/:id', verifyToken, getDocumentById);
router.get('/:id/download', verifyToken, downloadDocument);
router.delete('/:id', verifyToken, deleteDocument);

export default router;
