import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const proposalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    description: { type: String },
    budget: { type: Number, default: 0 },
    timeline: { type: String }, // e.g. "3 months"
    generatedBrief: { type: String },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions
);

export default mongoose.model('Proposal', proposalSchema);
