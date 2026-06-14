import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const reminderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['task_due', 'invoice_overdue', 'lead_followup', 'contract_renewal', 'custom'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, maxlength: 500 },
    entityType: {
      type: String,
      enum: ['Task', 'Invoice', 'Lead', 'Project', 'null'],
      default: null,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    dueAt: { type: Date, required: true, index: true },
    channels: {
      type: [String],
      enum: ['in_app', 'email'],
      default: ['in_app'],
    },
    isCompleted: { type: Boolean, default: false, index: true },
    isSnoozed: { type: Boolean, default: false },
    snoozeUntil: { type: Date, default: null },
    // Repeating reminders
    repeatRule: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    maxRepeats: { type: Number, default: 0 },
    repeatCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
  },
  baseSchemaOptions
);

reminderSchema.index({ dueAt: 1, isCompleted: 1 });
reminderSchema.index({ owner: 1, isCompleted: 1, dueAt: 1 });

export default mongoose.model('Reminder', reminderSchema);
