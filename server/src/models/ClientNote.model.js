import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const clientNoteSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    content: { type: String, required: true, maxlength: 50000 },
    contentText: { type: String, maxlength: 5000, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isPinned: { type: Boolean, default: false, index: true },
    pinnedAt: { type: Date, default: null },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String },
        size: { type: Number },
        type: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

// Indexes
clientNoteSchema.index({ client: 1, isPinned: -1, createdAt: -1 });
clientNoteSchema.index({ client: 1, isDeleted: 1 });
clientNoteSchema.index({ author: 1 });
clientNoteSchema.index({ contentText: 'text' });

// Pre-save hook
clientNoteSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    // 1. Strip HTML tags to store in contentText
    const stripped = this.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    this.contentText = stripped.substring(0, 5000);

    // 2. Extract @mention user IDs (24-character hex strings)
    const extractedMentions = [];
    const mentionRegex = /data-mention-id="([0-9a-fA-F]{24})"/g;
    const dataIdRegex = /data-id="([0-9a-fA-F]{24})"/g;
    let match;

    while ((match = mentionRegex.exec(this.content)) !== null) {
      extractedMentions.push(match[1]);
    }
    while ((match = dataIdRegex.exec(this.content)) !== null) {
      extractedMentions.push(match[1]);
    }

    this.mentions = [...new Set(extractedMentions)];

    // 3. Track editing
    if (!this.isNew) {
      this.isEdited = true;
      this.editedAt = new Date();
    }
  }

  next();
});

// Statics
clientNoteSchema.statics.findForClient = function (clientId) {
  return this.find({ client: clientId, isDeleted: false })
    .sort({ isPinned: -1, createdAt: -1 })
    .populate('author', 'firstName lastName avatar role')
    .populate('pinnedBy', 'firstName lastName');
};

export default mongoose.model('ClientNote', clientNoteSchema);
