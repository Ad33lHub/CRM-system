import { Router } from 'express';
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/leads.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createLeadSchema,
  updateLeadSchema,
  leadQuerySchema,
} from '../validators/lead.validator.js';

const router = Router();

router.get(
  '/',
  verifyToken,
  checkPermission('leads', 'read'),
  validate({ query: leadQuerySchema }),
  listLeads
);

router.get('/:id', verifyToken, checkPermission('leads', 'read'), getLead);

router.post(
  '/',
  verifyToken,
  checkPermission('leads', 'create'),
  validate({ body: createLeadSchema }),
  createLead
);

router.patch(
  '/:id',
  verifyToken,
  checkPermission('leads', 'update'),
  validate({ body: updateLeadSchema }),
  updateLead
);

router.delete('/:id', verifyToken, checkPermission('leads', 'delete'), deleteLead);

export default router;
