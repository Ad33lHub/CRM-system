import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission, checkRole } from '../middleware/rbac.middleware.js';
import {
  getClientReport,
  getClientList,
  getLeadConversion,
  getTopClients,
} from '../controllers/clientAnalytics.controller.js';

const router = Router();

const managerPlus = checkPermission('analytics', 'read');
const adminOnly = checkRole('super_admin', 'admin');

router.get('/', verifyToken, managerPlus, getClientList);
router.get('/lead-conversion', verifyToken, adminOnly, getLeadConversion);
router.get('/top', verifyToken, managerPlus, getTopClients);
router.get('/:id', verifyToken, getClientReport);

export default router;
