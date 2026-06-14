import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const messageSchema = new mongoose.Schema(
  {
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        publicId: { type: String },
        mimeType: { type: String },
        size: { type: Number },
      },
    ],
  },
  baseSchemaOptions
);

export default mongoose.model('Message', messageSchema);
