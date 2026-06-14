import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const clientStatusLogSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    fromStatus: {
      type: String,
      enum: ['lead', 'active', 'inactive', 'churned'],
      required: true,
    },
    toStatus: {
      type: String,
      enum: ['lead', 'active', 'inactive', 'churned'],
      required: true,
    },
    reason: { type: String, max: 500, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  baseSchemaOptions
);

// Indexes
clientStatusLogSchema.index({ client: 1, createdAt: -1 });

export default mongoose.model('ClientStatusLog', clientStatusLogSchema);
