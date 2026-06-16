import { Router } from 'express';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  restoreClient,
  addContact,
  removeContact,
  setPrimaryContact,
  getClientTags,
  getStatusLog,
  inviteClientPortalUser,
} from '../controllers/clients.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission, checkRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
  contactZodSchema,
} from '../validators/client.validator.js';

const router = Router();

// Tags (before :id params to avoid conflict)
router.get('/tags', verifyToken, checkPermission('clients', 'read'), getClientTags);

// Deleted clients (admin only)
router.get('/deleted', verifyToken, checkRole('super_admin', 'admin', 'manager'), getClients);

// CRUD
router.get(
  '/',
  verifyToken,
  checkPermission('clients', 'read'),
  validate({ query: clientQuerySchema }),
  getClients
);

router.post(
  '/',
  verifyToken,
  checkPermission('clients', 'create'),
  validate({ body: createClientSchema }),
  createClient
);

router.get('/:id', verifyToken, checkPermission('clients', 'read'), getClientById);

router.patch(
  '/:id',
  verifyToken,
  checkPermission('clients', 'update'),
  validate({ body: updateClientSchema }),
  updateClient
);

router.delete('/:id', verifyToken, checkPermission('clients', 'delete'), deleteClient);

// Restore
router.post('/:id/restore', verifyToken, checkRole('super_admin', 'admin'), restoreClient);

// Invite (provision a client-portal login) — admin only
router.post('/:id/invite', verifyToken, checkRole('super_admin', 'admin'), inviteClientPortalUser);

// Contacts
router.post(
  '/:id/contacts',
  verifyToken,
  checkPermission('clients', 'update'),
  validate({ body: contactZodSchema }),
  addContact
);

router.delete(
  '/:id/contacts/:contactId',
  verifyToken,
  checkPermission('clients', 'update'),
  removeContact
);

router.patch(
  '/:id/contacts/:contactId/primary',
  verifyToken,
  checkPermission('clients', 'update'),
  setPrimaryContact
);

router.get('/:id/status-log', verifyToken, checkPermission('clients', 'read'), getStatusLog);

export default router;
