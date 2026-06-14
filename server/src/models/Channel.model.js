import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const channelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['general', 'project', 'direct'],
      default: 'general',
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  baseSchemaOptions
);

export default mongoose.model('Channel', channelSchema);
