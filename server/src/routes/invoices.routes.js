import { Router } from 'express';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  approveInvoice,
  sendInvoice,
  voidInvoice,
  recordPayment,
  generateInvoicePdf,
} from '../controllers/invoices.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { checkPermission, clientPortalGuard } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  addPaymentSchema,
  voidInvoiceSchema,
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

router.get(
  '/:id/pdf',
  verifyToken,
  checkPermission('invoices', 'read'),
  clientPortalGuard,
  generateInvoicePdf
);

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

router.post('/:id/send', verifyToken, checkPermission('invoices', 'update'), sendInvoice);

router.post(
  '/:id/void',
  verifyToken,
  checkPermission('invoices', 'update'),
  validate({ body: voidInvoiceSchema }),
  voidInvoice
);

router.post(
  '/:id/payment',
  verifyToken,
  checkPermission('invoices', 'update'),
  validate({ body: addPaymentSchema }),
  recordPayment
);

export default router;
