import mongoose from 'mongoose';
import { baseSchemaOptions, softDeletePlugin } from '../config/mongoose.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'stage_change'],
    },
    note: { type: String },
    date: { type: Date, default: Date.now },
    doneBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    contactName: { type: String, required: true, trim: true },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
      validate: {
        validator: (value) => !value || EMAIL_REGEX.test(value),
        message: 'Invalid email address',
      },
    },
    contactPhone: { type: String, trim: true, default: null },
    company: { type: String, trim: true, default: null },
    source: {
      type: String,
      enum: ['referral', 'linkedin', 'website', 'cold_outreach', 'upwork', 'fiverr', 'other'],
      default: 'other',
    },
    stage: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'new',
    },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'PKR' },
    },
    expectedCloseDate: { type: Date, default: null },
    lostReason: { type: String, default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    aiScore: { type: Number, min: 0, max: 100, default: null },
    tags: { type: [String], default: [] },
    notes: { type: String, maxlength: 2000 },
    convertedToClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    convertedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activities: { type: [activitySchema], default: [] },
  },
  baseSchemaOptions
);

leadSchema.plugin(softDeletePlugin);

leadSchema.index({ stage: 1 });
leadSchema.index({ assignedTo: 1, stage: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ contactEmail: 1 });
leadSchema.index({ title: 'text', contactName: 'text', company: 'text' });

export default mongoose.model('Lead', leadSchema);
