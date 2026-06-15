import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const messageSchema = new mongoose.Schema(
  {
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true },
    // 'everyone' = broadcast to all channel members
    // 'role:<roleName>' = sent to a role group (e.g. 'role:manager')
    // ObjectId string = DM to specific user
    recipient: { type: String, default: 'everyone', index: true },
    isPinned: { type: Boolean, default: false },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pinnedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
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
