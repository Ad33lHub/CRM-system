import mongoose from 'mongoose';
import { baseSchemaOptions, softDeletePlugin } from '../config/mongoose.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const leadActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['stage_change', 'edit', 'comment'],
      required: true,
    },
    note: { type: String, required: true },
    date: { type: Date, default: Date.now },
    doneBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => EMAIL_REGEX.test(value),
        message: 'Invalid email address',
      },
    },
    phone: { type: String, trim: true, default: '' },
    source: {
      type: String,
      enum: ['Manual', 'Website', 'Referral', 'Social', 'Other'],
      default: 'Manual',
    },
    stage: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Won', 'Lost'],
      default: 'New',
    },
    value: { type: Number, default: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    notes: { type: String, default: '' },
    expectedCloseDate: { type: Date, default: null },
    convertedToClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    convertedAt: { type: Date, default: null },
    lostReason: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activities: { type: [leadActivitySchema], default: [] },
  },
  baseSchemaOptions
);

leadSchema.plugin(softDeletePlugin);

leadSchema.index({ stage: 1 });
leadSchema.index({ assignedTo: 1, stage: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ fullName: 'text', company: 'text', email: 'text' });

export default mongoose.model('Lead', leadSchema);
