import { Router } from 'express';
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getAssignableMembers,
  exportLeads,
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

// 1. Visible members list for assignedTo dropdown scoping
router.get(
  '/members',
  verifyToken,
  checkPermission('leads', 'read'),
  getAssignableMembers
);

// 2. CSV Data Export (Admin only)
router.get(
  '/export',
  verifyToken,
  checkPermission('leads', 'read'),
  exportLeads
);

// 3. Main CRUD Pipeline Routes
router.get(
  '/',
  verifyToken,
  checkPermission('leads', 'read'),
  validate({ query: leadQuerySchema }),
  listLeads
);

router.get(
  '/:id',
  verifyToken,
  checkPermission('leads', 'read'),
  getLead
);

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

router.delete(
  '/:id',
  verifyToken,
  checkPermission('leads', 'delete'),
  deleteLead
);

export default router;
