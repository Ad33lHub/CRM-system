import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { writeEmail } from '../controllers/tools.controller.js';
import { checkRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import { emailWriterSchema } from '../validators/tools.validator.js';

const router = Router();

router.post(
  '/email-writer',
  verifyToken,
  checkRole('super_admin', 'admin', 'manager'),
  aiLimiter,
  validate({ body: emailWriterSchema }),
  writeEmail
);

export default router;
