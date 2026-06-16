import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'];
const PAYMENT_METHODS = ['jazzcash', 'easypaisa', 'bank_transfer', 'stripe', 'other'];

const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().positive().max(10000),
  unitPrice: z.coerce.number().nonnegative().max(1e9),
});

export const createInvoiceSchema = z.object({
  client: OBJECT_ID,
  project: OBJECT_ID.optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item required'),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  currency: z.string().trim().length(3).default('PKR'),
  dueDate: z.coerce.date(),
  notes: z.string().trim().max(1000).optional(),
  createdBy: OBJECT_ID.optional(),
});

export const updateInvoiceSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1).optional(),
  taxPercent: z.coerce.number().min(0).max(100).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  currency: z.string().trim().length(3).optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const addPaymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be positive'),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  paymentNotes: z.string().trim().max(500).optional(),
  paymentProof: z
    .union([z.string().trim().url(), z.object({ url: z.string().url() }).passthrough()])
    .optional(),
});

export const voidInvoiceSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum([...STATUSES, 'all']).default('all'),
  clientId: OBJECT_ID.optional(),
  projectId: OBJECT_ID.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
