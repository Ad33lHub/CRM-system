import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/rbac.middleware.js';
import { getPresenceList, getActivityDashboard } from '../controllers/admin.controller.js';

const router = Router();

router.get('/presence', verifyToken, checkRole('super_admin', 'admin'), getPresenceList);
router.get('/activity', verifyToken, checkRole('super_admin'), getActivityDashboard);

export default router;
