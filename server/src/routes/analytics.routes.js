import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueChart,
  getLeadFunnel,
  getTaskStatusChart,
  getActivityFeed,
} from '../controllers/analytics.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.get(
  '/dashboard-stats',
  verifyToken,
  checkPermission('analytics', 'read'),
  getDashboardStats
);
router.get('/revenue-chart', verifyToken, checkPermission('analytics', 'read'), getRevenueChart);
router.get('/lead-funnel', verifyToken, checkPermission('analytics', 'read'), getLeadFunnel);
router.get('/task-status', verifyToken, checkPermission('analytics', 'read'), getTaskStatusChart);
router.get('/activity-feed', verifyToken, getActivityFeed);

export default router;
