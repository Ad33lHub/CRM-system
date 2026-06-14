import Invoice from '../models/Invoice.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';
import { queueEmail } from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';
import logger from '../utils/logger.js';

async function triggerPaymentEmails(invoice, amountPaid, recordedBy) {
  try {
    const populated = await Invoice.findById(invoice._id)
      .populate('client', 'name email')
      .populate('createdBy', 'name firstName lastName')
      .lean();

    if (!populated) return;

    const clientName = populated.client?.name || 'Client';
    const clientEmail = populated.client?.email;
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
          invoiceUrl: `${process.env.APP_URL || ''}/portal/invoices/${populated._id}`,
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
            invoiceUrl: `${process.env.APP_URL || ''}/portal/invoices/${populated._id}`,
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
        message: `${clientName} paid ${populated.currency} ${amountPaid.toLocaleString()}. ${remaining > 0 ? `Remaining: ${populated.currency} ${remaining.toLocaleString()}` : 'Fully paid!'}`,
        link: `/invoices/${populated._id}`,
        groupKey: `invoice:${populated._id}:payment`,
        priority: remaining <= 0 ? 'high' : 'normal',
      });
    }
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
  if (req.user && req.user.role === 'client') {
    filter.client = req.user.clientId;
  }
  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Invoice.countDocuments(filter),
  ]);
  return paginatedResponse(res, items, page, limit, total, 'Invoice list fetched successfully');
});

export const getInvoice = asyncHandler(async (req, res) => {
  const doc = await Invoice.findById(req.params.id);
  if (!doc) return errorResponse(res, 'Invoice not found', 404);
  return successResponse(res, doc, 'Invoice fetched successfully');
});

export const createInvoice = asyncHandler(async (req, res) => {
  const doc = await Invoice.create(req.body);
  return successResponse(res, doc, 'Invoice created successfully', 201);
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const doc = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) return errorResponse(res, 'Invoice not found', 404);
  return successResponse(res, doc, 'Invoice updated successfully');
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  const doc = await Invoice.findByIdAndDelete(req.params.id);
  if (!doc) return errorResponse(res, 'Invoice not found', 404);
  return successResponse(res, { id: req.params.id }, 'Invoice deleted successfully');
});

export const approveInvoice = asyncHandler(async (req, res) => {
  const doc = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status: 'sent', approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  );
  if (!doc) return errorResponse(res, 'Invoice not found', 404);
  return successResponse(res, doc, 'Invoice approved successfully');
});

export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, paymentNotes } = req.body;
  if (!amount || amount <= 0) return errorResponse(res, 'Invalid payment amount', 400);

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  const newPaid = (invoice.paidAmount || 0) + amount;
  const status = newPaid >= invoice.total ? 'paid' : 'partially_paid';

  const doc = await Invoice.findByIdAndUpdate(
    req.params.id,
    {
      paidAmount: newPaid,
      status,
      paymentMethod: paymentMethod || invoice.paymentMethod,
      paymentNotes: paymentNotes || invoice.paymentNotes,
      ...(status === 'paid' ? { paidAt: new Date() } : {}),
    },
    { new: true }
  );

  triggerPaymentEmails(doc, amount, req.user).catch(() => {});

  return successResponse(res, doc, 'Payment recorded successfully');
});

export default {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  approveInvoice,
  recordPayment,
};
