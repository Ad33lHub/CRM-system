import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { listMessages, sendMessage, listThreads } from '../controllers/portal.controller.js';
import { sendMessageSchema, threadQuerySchema } from '../validators/portal.validator.js';

const router = Router();

// Clients and the staff who run their projects (managers/admins) share these
// per-project message threads.
const PARTICIPANTS = checkRole('client', 'manager', 'admin', 'super_admin');

router.get('/threads', verifyToken, PARTICIPANTS, listThreads);
router.get(
  '/messages',
  verifyToken,
  PARTICIPANTS,
  validate({ query: threadQuerySchema }),
  listMessages
);
router.post(
  '/messages',
  verifyToken,
  PARTICIPANTS,
  validate({ body: sendMessageSchema }),
  sendMessage
);

export default router;
