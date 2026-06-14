import mongoose from 'mongoose';
import { baseSchemaOptions, softDeletePlugin } from '../config/mongoose.js';

const assigneeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String },
    url: { type: String },
    publicId: { type: String },
    size: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String },
    from: { type: String },
    to: { type: String },
    note: { type: String },
    doneBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doneAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, maxlength: 3000 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    milestone: { type: mongoose.Schema.Types.ObjectId, default: null },
    assignees: { type: [assigneeSchema], default: [] },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'testing', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    estimatedHours: { type: Number, default: 0, min: 0 },
    loggedHours: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    tags: { type: [String], default: [] },
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    attachments: { type: [attachmentSchema], default: [] },
    activityLog: { type: [activityLogSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions
);

taskSchema.plugin(softDeletePlugin);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ 'assignees.user': 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ title: 'text' });

export default mongoose.model('Task', taskSchema);
