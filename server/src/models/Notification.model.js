import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const NOTIFICATION_TYPES = [
  'task',
  'project',
  'invoice',
  'lead',
  'system',
  'mention',
  'reminder',
  'payment',
  'leave',
  'chat',
  'employee',
  'deadline',
  'performance',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, default: null },
    // Batching: group repeated notifications of the same event
    groupKey: { type: String, default: null, index: true },
    batchCount: { type: Number, default: 1, min: 1 },
    // Priority for urgent alerts (payment overdue, deadline imminent)
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  },
  baseSchemaOptions
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, groupKey: 1, createdAt: -1 });
// TTL index: documents auto-delete once expiresAt passes (null = never expires).
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export { NOTIFICATION_TYPES };
export default mongoose.model('Notification', notificationSchema);
