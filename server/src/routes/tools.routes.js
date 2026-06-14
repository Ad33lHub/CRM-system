import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { writeEmail } from '../controllers/tools.controller.js';
import { checkRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.post('/email-writer', verifyToken, checkRole('super_admin', 'admin'), writeEmail);

export default router;
