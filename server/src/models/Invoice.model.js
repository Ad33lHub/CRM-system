import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

lineItemSchema.virtual('total').get(function getLineTotal() {
  return this.quantity * this.unitPrice;
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, default: 'PKR' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'],
      default: 'draft',
    },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date, default: null },
    paidAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'bank_transfer', 'stripe', 'other'],
      default: null,
    },
    paymentProof: { type: String, default: null },
    paymentNotes: { type: String, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    notes: { type: String, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    escalated: { type: Boolean, default: false },
  },
  baseSchemaOptions
);

// invoiceNumber unique index is created by the field-level `unique: true` above.
invoiceSchema.index({ client: 1, status: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ createdAt: -1 });

// Compute monetary fields and generate the invoice number BEFORE validation,
// so the `required` subtotal/total/invoiceNumber checks see populated values.
invoiceSchema.pre('validate', async function computeAndNumber(next) {
  try {
    const subtotal = (this.lineItems || []).reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    this.subtotal = subtotal;
    this.taxAmount = (subtotal * (this.taxPercent || 0)) / 100;
    this.discountAmount = (subtotal * (this.discountPercent || 0)) / 100;
    this.total = subtotal + this.taxAmount - this.discountAmount;

    if (this.isNew && !this.invoiceNumber) {
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      const last = await this.constructor
        .findOne({ invoiceNumber: new RegExp(`^${prefix}`) })
        .sort({ invoiceNumber: -1 })
        .lean();
      let seq = 1;
      if (last && last.invoiceNumber) {
        seq = parseInt(last.invoiceNumber.split('-')[2], 10) + 1;
      }
      this.invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

export default mongoose.model('Invoice', invoiceSchema);
