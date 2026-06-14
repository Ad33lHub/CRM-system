import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission, checkRole } from '../middleware/rbac.middleware.js';
import {
  getRevenueDashboard,
  getRevenueByMonth,
  getRevenueByClient,
  getRevenueByType,
  getRevenueGrowth,
  getReceivables,
} from '../controllers/revenueAnalytics.controller.js';

const router = Router();

const managerPlus = checkPermission('analytics', 'read');
const adminOnly = checkRole('super_admin', 'admin');

router.get('/dashboard', verifyToken, managerPlus, getRevenueDashboard);
router.get('/monthly', verifyToken, managerPlus, getRevenueByMonth);
router.get('/by-client', verifyToken, managerPlus, getRevenueByClient);
router.get('/by-type', verifyToken, managerPlus, getRevenueByType);
router.get('/growth', verifyToken, managerPlus, getRevenueGrowth);
router.get('/receivables', verifyToken, adminOnly, getReceivables);

export default router;
