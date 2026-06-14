import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema(
  {
    versionNumber: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    changeNote: {
      type: String,
      maxlength: 500,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['client', 'project', 'employee', 'invoice', 'proposal', 'lead'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'contract',
        'nda',
        'id_card',
        'deliverable',
        'invoice_document',
        'proposal_document',
        'certificate',
        'tax_form',
        'report',
        'other',
      ],
    },
    tags: {
      type: [String],
      validate: [(val) => val.length <= 5, 'Tags exceed limit of 5'],
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    versions: [versionSchema],
    currentUrl: {
      type: String,
      required: true,
    },
    currentPublicId: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    totalSize: {
      type: Number,
      default: 0,
    },
    accessLevel: {
      type: String,
      enum: ['private', 'team', 'admin_only'],
      default: 'team',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtuals
documentSchema.virtual('activeVersion').get(function () {
  return this.versions ? this.versions.find((v) => v.isActive) : null;
});

documentSchema.virtual('versionCount').get(function () {
  return this.versions ? this.versions.length : 0;
});

documentSchema.virtual('isExpiringSoon').get(function () {
  if (!this.expiresAt || this.isExpired || this.isDeleted) return false;
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiresAt < thirtyDaysFromNow && this.expiresAt > now;
});

// Pre-save hook
documentSchema.pre('save', function (next) {
  if (this.versions && this.versions.length > 0) {
    let highestVersion = this.versions[0];
    for (const v of this.versions) {
      if (v.versionNumber > highestVersion.versionNumber) {
        highestVersion = v;
      }
    }

    this.versions.forEach((v) => {
      v.isActive = v.versionNumber === highestVersion.versionNumber;
    });

    this.currentVersion = highestVersion.versionNumber;
    this.currentUrl = highestVersion.url;
    this.currentPublicId = highestVersion.publicId;
    this.totalSize = this.versions.reduce((sum, v) => sum + (v.size || 0), 0);
  }
  next();
});

// Indexes
documentSchema.index({ entityType: 1, entityId: 1, isDeleted: 1 });
documentSchema.index({ category: 1, entityId: 1 });
documentSchema.index({ expiresAt: 1 });
documentSchema.index({ createdBy: 1 });

export default mongoose.model('Document', documentSchema);
