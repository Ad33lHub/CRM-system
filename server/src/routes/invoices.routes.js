import { Router } from 'express';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  approveInvoice,
  recordPayment,
} from '../controllers/invoices.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission, clientPortalGuard } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  addPaymentSchema,
  invoiceQuerySchema,
} from '../validators/invoice.validator.js';

const router = Router();

router.get(
  '/',
  verifyToken,
  checkPermission('invoices', 'read'),
  validate({ query: invoiceQuerySchema }),
  listInvoices
);

router.get('/:id', verifyToken, checkPermission('invoices', 'read'), clientPortalGuard, getInvoice);

router.post(
  '/',
  verifyToken,
  checkPermission('invoices', 'create'),
  validate({ body: createInvoiceSchema }),
  createInvoice
);

router.put(
  '/:id',
  verifyToken,
  checkPermission('invoices', 'update'),
  validate({ body: updateInvoiceSchema }),
  updateInvoice
);

router.delete('/:id', verifyToken, checkPermission('invoices', 'delete'), deleteInvoice);

router.post('/:id/approve', verifyToken, checkPermission('invoices', 'approve'), approveInvoice);

router.post(
  '/:id/payment',
  verifyToken,
  checkPermission('invoices', 'update'),
  validate({ body: addPaymentSchema }),
  recordPayment
);

export default router;
