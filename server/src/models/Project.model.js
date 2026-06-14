import mongoose from 'mongoose';
import { baseSchemaOptions, softDeletePlugin } from '../config/mongoose.js';

const teamMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['pm', 'lead_dev', 'developer', 'designer', 'qa'] },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date },
    completedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'on_hold', 'completed', 'cancelled'],
      default: 'draft',
    },
    health: { type: String, enum: ['green', 'amber', 'red'], default: 'green' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    team: { type: [teamMemberSchema], default: [] },
    milestones: { type: [milestoneSchema], default: [] },
    budget: {
      estimated: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
      currency: { type: String, default: 'PKR' },
    },
    startDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    onHoldReason: { type: String, default: null },
    cancelReason: { type: String, default: null },
    tags: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions
);

projectSchema.plugin(softDeletePlugin);

projectSchema.virtual('completionPercent').get(function getCompletionPercent() {
  if (!this.milestones || this.milestones.length === 0) return 0;
  const total = this.milestones.reduce((sum, m) => sum + (m.completionPercent || 0), 0);
  return Math.round(total / this.milestones.length);
});

projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ 'team.user': 1 });
projectSchema.index({ status: 1, deadline: 1 });
projectSchema.index({ name: 'text' });

export default mongoose.model('Project', projectSchema);
