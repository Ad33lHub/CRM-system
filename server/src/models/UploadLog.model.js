import mongoose from 'mongoose';

const uploadLogSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        'client',
        'project',
        'task',
        'invoice',
        'employee',
        'chat',
        'meeting',
        'proposal',
        'payment_proof',
        'profile',
        'document',
        'receipt',
        'performance',
        'other',
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    detectedMime: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    folder: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
uploadLogSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadLogSchema.index({ entityType: 1, entityId: 1 });
uploadLogSchema.index({ createdAt: -1 });

// Statics
uploadLogSchema.statics.getStorageUsed = async function (entityType, entityId) {
  const result = await this.aggregate([
    {
      $match: {
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$size' },
      },
    },
  ]);
  return result.length > 0 ? result[0].totalSize : 0;
};

uploadLogSchema.statics.getUserStorageUsed = async function (userId) {
  const result = await this.aggregate([
    {
      $match: {
        uploadedBy: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$size' },
      },
    },
  ]);
  return result.length > 0 ? result[0].totalSize : 0;
};

export default mongoose.model('UploadLog', uploadLogSchema);
