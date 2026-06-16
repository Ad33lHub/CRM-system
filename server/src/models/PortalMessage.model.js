import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

/**
 * A message in a per-project thread between a client (portal) and the
 * manager(s) who run that project. `fromClient` marks the direction.
 */
const portalMessageSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromClient: { type: Boolean, default: false },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readByStaff: { type: Boolean, default: false },
    readByClient: { type: Boolean, default: false },
  },
  baseSchemaOptions
);

portalMessageSchema.index({ project: 1, createdAt: 1 });

export default mongoose.model('PortalMessage', portalMessageSchema);
