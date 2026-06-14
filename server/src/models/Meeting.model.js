import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true, default: null },
    summary: { type: String },
    actionItems: [
      {
        task: { type: String },
        assignee: { type: String },
        dueDate: { type: Date },
      },
    ],
    transcript: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        publicId: { type: String },
        mimeType: { type: String },
      },
    ],
  },
  baseSchemaOptions
);

export default mongoose.model('Meeting', meetingSchema);
