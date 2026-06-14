import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/rbac.middleware.js';
import { exportLimiter } from '../middleware/rateLimiter.middleware.js';
import { exportRevenue, exportEmployees, exportClients } from '../controllers/export.controller.js';

const router = Router();

const managerPlus = checkPermission('analytics', 'read');

router.get('/revenue', verifyToken, exportLimiter, managerPlus, exportRevenue);
router.get('/employees', verifyToken, exportLimiter, managerPlus, exportEmployees);
router.get('/clients', verifyToken, exportLimiter, managerPlus, exportClients);

export default router;
