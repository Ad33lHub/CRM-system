import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/rbac.middleware.js';
import { exportLimiter } from '../middleware/rateLimiter.middleware.js';
import { getReportsSummary } from '../controllers/reports.controller.js';

const router = Router();

router.get(
  '/',
  verifyToken,
  checkPermission('analytics', 'read'),
  exportLimiter,
  getReportsSummary
);

export default router;
