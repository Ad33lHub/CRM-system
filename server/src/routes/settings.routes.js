import { Router } from 'express';
import { getSettings, updateSettings, broadcast } from '../controllers/settings.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateSettingsSchema, broadcastSchema } from '../validators/settings.validator.js';

const router = Router();

// All settings routes are Super Admin only.
router.use(verifyToken, checkRole('super_admin'));

router.get('/', getSettings);
router.patch('/', validate({ body: updateSettingsSchema }), updateSettings);
router.post('/broadcast', validate({ body: broadcastSchema }), broadcast);

export default router;
