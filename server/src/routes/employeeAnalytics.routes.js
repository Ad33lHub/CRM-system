import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/rbac.middleware.js';
import {
  getEmployeeReport,
  getTeamReport,
  getEmployeeRanking,
} from '../controllers/employeeAnalytics.controller.js';

const router = Router();

const managerPlus = checkPermission('analytics', 'read');

router.get('/team', verifyToken, managerPlus, getTeamReport);
router.get('/ranking', verifyToken, managerPlus, getEmployeeRanking);
router.get('/:id', verifyToken, getEmployeeReport);

export default router;
