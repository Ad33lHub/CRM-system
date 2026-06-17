import Invoice from '../models/Invoice.model.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';
import { queueEmail } from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';
import { clearRevenueCache } from '../services/revenueAnalytics.service.js';
import { clearClientCache } from '../services/clientAnalytics.service.js';
import { exportInvoicePdf } from '../services/exportService.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const CLIENT_FIELDS = 'companyName industry contacts';
const PROJECT_FIELDS = 'name status';

// Populate the references the UI renders. Reused by every read/write response.
function populateInvoice(query) {
  return query
    .populate('client', CLIENT_FIELDS)
    .populate('project', PROJECT_FIELDS)
    .populate('createdBy', 'firstName lastName name email')
    .populate('approvedBy', 'firstName lastName name');
}

// Resolve the client's billing email — Client has no top-level email, only contacts[].
function resolveClientContact(client) {
  if (!client) return { name: 'Client', email: null };
  const contacts = client.contacts || [];
  const primary = contacts.find((c) => c.isPrimary && c.email) || contacts.find((c) => c.email);
  return {
    name: primary?.name || client.companyName || 'Client',
    email: primary?.email || null,
  };
}

function portalUrl(invoiceId) {
  return `${config.CLIENT_URL || ''}/portal/invoices/${invoiceId}`;
}

/**
 * Surface an invoice event inside the client's portal: every portal user tied to
 * this client gets an in-app notification linking to the portal invoice. Best-effort;
 * never blocks the request.
 */
async function notifyClientPortal(clientId, { title, message, invoiceId, priority = 'normal' }) {
  if (!clientId) return;
  try {
    const portalUsers = await User.find({ role: 'client', clientId }).select('_id').lean();
    await Promise.all(
      portalUsers.map((u) =>
        createNotification({
          recipient: u._id,
          type: 'invoice',
          title,
          message,
          link: `/portal/invoices/${invoiceId}`,
          groupKey: `portal:invoice:${invoiceId}`,
          priority,
        })
      )
    );
  } catch (err) {
    logger.error(`Client portal invoice notification failed for ${invoiceId}: ${err.message}`);
  }
}

async function triggerPaymentEmails(invoice, amountPaid, recordedBy) {
  try {
    const populated = await Invoice.findById(invoice._id)
      .populate('client', 'companyName contacts')
      .populate('createdBy', 'name firstName lastName')
      .lean();

    if (!populated) return;

    const { name: clientName, email: clientEmail } = resolveClientContact(populated.client);
    const remaining = populated.total - populated.paidAmount;
    const remainingColor = remaining <= 0 ? '059669' : 'DC2626';

    if (clientEmail) {
      await queueEmail({
        to: clientEmail,
        subject: `Payment received — Invoice ${populated.invoiceNumber}`,
        templateName: 'paymentReceived',
        templateVars: {
          clientName,
          invoiceNumber: populated.invoiceNumber,
          amount: amountPaid.toLocaleString(),
          currency: populated.currency || 'PKR',
          remaining: Math.max(0, remaining).toLocaleString(),
          remainingColor,
          paymentDate: new Date().toLocaleDateString('en-PK'),
          invoiceUrl: portalUrl(populated._id),
          unsubscribeUrl: '',
        },
      });

      if (remaining <= 0) {
        const recorderName = recordedBy
          ? `${recordedBy.firstName || ''} ${recordedBy.lastName || ''}`.trim()
          : 'Finance Team';

        await queueEmail({
          to: clientEmail,
          subject: `Official Receipt — Invoice ${populated.invoiceNumber}`,
          templateName: 'paymentReceipt',
          templateVars: {
            clientName,
            invoiceNumber: populated.invoiceNumber,
            amount: populated.total.toLocaleString(),
            currency: populated.currency || 'PKR',
            reference: invoice.paymentNotes || invoice._id.toString(),
            verifiedBy: recorderName,
            paymentDate: new Date().toLocaleDateString('en-PK'),
            companyName: 'Verixsoft',
            invoiceUrl: portalUrl(populated._id),
            unsubscribeUrl: '',
          },
        });
      }
    }

    if (populated.createdBy) {
      await createNotification({
        recipient: populated.createdBy._id || populated.createdBy,
        type: 'payment',
        title: `Payment received — ${populated.invoiceNumber}`,
        message: `${clientName} paid ${populated.currency} ${amountPaid.toLocaleString()}. ${
          remaining > 0
            ? `Remaining: ${populated.currency} ${remaining.toLocaleString()}`
            : 'Fully paid!'
        }`,
        link: `/invoices/${populated._id}`,
        groupKey: `invoice:${populated._id}:payment`,
        priority: remaining <= 0 ? 'high' : 'normal',
      });
    }

    // Mirror the payment receipt inside the client's portal.
    await notifyClientPortal(populated.client?._id || populated.client, {
      title: `Payment received — ${populated.invoiceNumber}`,
      message:
        remaining <= 0
          ? `Your invoice ${populated.invoiceNumber} is now fully paid. Thank you!`
          : `We received ${populated.currency || 'PKR'} ${amountPaid.toLocaleString()}. Remaining balance: ${
              populated.currency || 'PKR'
            } ${Math.max(0, remaining).toLocaleString()}.`,
      invoiceId: populated._id,
    });
  } catch (err) {
    logger.error(`Payment email trigger failed for invoice ${invoice._id}: ${err.message}`);
  }
}

export const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  if (req.query.clientId) {
    filter.client = req.query.clientId;
  }
  if (req.query.projectId) {
    filter.project = req.query.projectId;
  }
  if (req.user && req.user.role === 'client') {
    // Clients only ever see their own company's issued invoices — drafts and
    // voided invoices are internal and stay hidden from the portal.
    filter.client = req.user.clientId;
    filter.status = { $nin: ['draft', 'void'] };
  }
  const [items, total] = await Promise.all([
    populateInvoice(Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Invoice.countDocuments(filter),
  ]);
  return paginatedResponse(res, items, page, limit, total, 'Invoice list fetched successfully');
});

// Statuses a client portal user must never see — internal drafts and voids.
const CLIENT_HIDDEN_STATUSES = ['draft', 'void'];

export const getInvoice = asyncHandler(async (req, res) => {
  const doc = await populateInvoice(Invoice.findById(req.params.id));
  if (!doc) return errorResponse(res, 'Invoice not found', 404);
  if (req.user?.role === 'client' && CLIENT_HIDDEN_STATUSES.includes(doc.status)) {
    return errorResponse(res, 'Invoice not found', 404);
  }
  return successResponse(res, doc, 'Invoice fetched successfully');
});

export const createInvoice = asyncHandler(async (req, res) => {
  // Server owns numbering, totals and ownership — never trust the client for these.
  const { client, project, lineItems, taxPercent, discountPercent, currency, dueDate, notes } =
    req.body;

  const created = await Invoice.create({
    client,
    project: project || null,
    lineItems,
    taxPercent,
    discountPercent,
    currency,
    dueDate,
    notes,
    createdBy: req.user._id,
  });

  const doc = await populateInvoice(Invoice.findById(created._id));
  clearRevenueCache().catch(() => {});
  return successResponse(res, doc, 'Invoice created successfully', 201);
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  // Only editable while it is still a draft.
  if (invoice.status !== 'draft') {
    return errorResponse(res, 'Only draft invoices can be edited', 409);
  }

  const editable = ['lineItems', 'taxPercent', 'discountPercent', 'currency', 'dueDate', 'notes'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) invoice[field] = req.body[field];
  });
  await invoice.save(); // re-runs the pre-validate totals hook

  const doc = await populateInvoice(Invoice.findById(invoice._id));
  clearRevenueCache().catch(() => {});
  return successResponse(res, doc, 'Invoice updated successfully');
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  const doc = await Invoice.findByIdAndDelete(req.params.id);
  if (!doc) return errorResponse(res, 'Invoice not found', 404);
  clearRevenueCache().catch(() => {});
  return successResponse(res, { id: req.params.id }, 'Invoice deleted successfully');
});

export const approveInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  invoice.approvedBy = req.user._id;
  invoice.approvedAt = new Date();
  await invoice.save();

  const doc = await populateInvoice(Invoice.findById(invoice._id));
  return successResponse(res, doc, 'Invoice approved successfully');
});

/**
 * Send an invoice to the client.
 * Transitions draft/overdue → sent, stamps sentAt, emails the client's
 * primary contact and notifies the creator.
 */
export const sendInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client', 'companyName contacts');
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  if (['paid', 'void'].includes(invoice.status)) {
    return errorResponse(res, `Cannot send a ${invoice.status} invoice`, 409);
  }

  const { name: clientName, email: clientEmail } = resolveClientContact(invoice.client);
  if (!clientEmail) {
    return errorResponse(
      res,
      'Client has no contact email on file — add a contact before sending',
      422
    );
  }

  invoice.status = 'sent';
  invoice.sentAt = new Date();
  await invoice.save();

  await queueEmail({
    to: clientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from Verixsoft`,
    templateName: 'invoiceSent',
    templateVars: {
      clientName,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amountDue.toLocaleString(),
      currency: invoice.currency || 'PKR',
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-PK') : '—',
      invoiceUrl: portalUrl(invoice._id),
      unsubscribeUrl: '',
    },
  });

  if (invoice.createdBy) {
    createNotification({
      recipient: invoice.createdBy,
      type: 'invoice',
      title: `Invoice ${invoice.invoiceNumber} sent`,
      message: `Sent to ${clientName} (${clientEmail}).`,
      link: `/invoices/${invoice._id}`,
      groupKey: `invoice:${invoice._id}:sent`,
    }).catch(() => {});
  }

  // Surface the issued invoice inside the client's portal.
  notifyClientPortal(invoice.client?._id || invoice.client, {
    title: `New invoice ${invoice.invoiceNumber}`,
    message: `An invoice for ${invoice.currency || 'PKR'} ${invoice.amountDue.toLocaleString()} is ready to view. Due ${
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-PK') : 'soon'
    }.`,
    invoiceId: invoice._id,
  }).catch(() => {});

  const doc = await populateInvoice(Invoice.findById(invoice._id));
  return successResponse(res, doc, `Invoice sent to ${clientEmail}`);
});

export const voidInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  if (invoice.status === 'paid') {
    return errorResponse(res, 'A paid invoice cannot be voided', 409);
  }

  invoice.status = 'void';
  invoice.voidReason = req.body.reason;
  invoice.voidedAt = new Date();
  await invoice.save();

  const doc = await populateInvoice(Invoice.findById(invoice._id));
  clearRevenueCache().catch(() => {});
  return successResponse(res, doc, 'Invoice voided successfully');
});

export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, paymentNotes, paymentProof } = req.body;
  if (!amount || amount <= 0) return errorResponse(res, 'Invalid payment amount', 400);

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  if (invoice.status === 'void') return errorResponse(res, 'Cannot pay a void invoice', 409);
  if (invoice.status === 'draft') {
    return errorResponse(res, 'Send the invoice before recording a payment', 409);
  }

  const newPaid = Math.round(((invoice.paidAmount || 0) + amount) * 100) / 100;
  // Cap at invoice total — amountDue should never go negative.
  const cappedPaid = Math.min(newPaid, invoice.total);
  const status = cappedPaid >= invoice.total ? 'paid' : 'partially_paid';

  invoice.paidAmount = cappedPaid;
  invoice.status = status;
  if (paymentMethod) invoice.paymentMethod = paymentMethod;
  if (paymentNotes) invoice.paymentNotes = paymentNotes;
  if (paymentProof)
    invoice.paymentProof = typeof paymentProof === 'string' ? paymentProof : paymentProof.url;
  if (status === 'paid') invoice.paidAt = new Date();
  await invoice.save();

  triggerPaymentEmails(invoice, amount, req.user).catch(() => {});
  clearRevenueCache().catch(() => {});
  clearClientCache(invoice.client?.toString()).catch(() => {});

  const doc = await populateInvoice(Invoice.findById(invoice._id));
  return successResponse(res, doc, 'Payment recorded successfully');
});

export const generateInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await populateInvoice(Invoice.findById(req.params.id)).lean();
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  if (req.user?.role === 'client' && CLIENT_HIDDEN_STATUSES.includes(invoice.status)) {
    return errorResponse(res, 'Invoice not found', 404);
  }

  const generatedBy = req.user
    ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.name || 'System'
    : 'System';
  const buffer = await exportInvoicePdf(invoice, generatedBy);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  return res.send(buffer);
});

export default {
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
};
