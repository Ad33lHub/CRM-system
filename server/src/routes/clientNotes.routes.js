import { Router } from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
} from '../controllers/clientNotes.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission, checkRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createNoteSchema, updateNoteSchema } from '../validators/client.validator.js';

const router = Router();

router.get('/clients/:clientId/notes', verifyToken, checkPermission('clients', 'read'), getNotes);

router.post(
  '/clients/:clientId/notes',
  verifyToken,
  checkPermission('clients', 'read'),
  validate({ body: createNoteSchema }),
  createNote
);

router.patch(
  '/clients/:clientId/notes/:noteId',
  verifyToken,
  checkPermission('clients', 'read'),
  validate({ body: updateNoteSchema }),
  updateNote
);

router.delete(
  '/clients/:clientId/notes/:noteId',
  verifyToken,
  checkPermission('clients', 'read'),
  deleteNote
);

router.patch(
  '/clients/:clientId/notes/:noteId/pin',
  verifyToken,
  checkRole('super_admin', 'admin', 'manager'),
  togglePin
);

export default router;
