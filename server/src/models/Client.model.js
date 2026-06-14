import mongoose from 'mongoose';
import { baseSchemaOptions, softDeletePlugin } from '../config/mongoose.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;

/* ── Contact Sub-Schema ─────────────────────────────────────────────── */
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => !v || EMAIL_REGEX.test(v),
        message: 'Invalid email address',
      },
    },
    phone: { type: String, trim: true, default: null },
    designation: { type: String, trim: true, maxlength: 100, default: null },
    department: { type: String, trim: true, maxlength: 100, default: null },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    notes: { type: String, maxlength: 500, default: null },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ── Billing Address Sub-Schema ─────────────────────────────────────── */
const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    country: { type: String, trim: true, default: 'Pakistan' },
    postalCode: { type: String, trim: true, default: null },
  },
  { _id: false }
);

/* ── Main Client Schema ─────────────────────────────────────────────── */
const clientSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: { type: String, unique: true, lowercase: true },
    industry: {
      type: String,
      required: true,
      enum: [
        'technology',
        'finance',
        'healthcare',
        'education',
        'retail',
        'real_estate',
        'manufacturing',
        'media',
        'consulting',
        'other',
      ],
      default: 'other',
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
      default: null,
    },
    website: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (v) => !v || URL_REGEX.test(v),
        message: 'Invalid URL format',
      },
    },
    contacts: {
      type: [contactSchema],
      default: [],
      validate: {
        validator(v) {
          return v && v.length >= 1;
        },
        message: 'At least one contact is required',
      },
    },
    billingAddress: { type: addressSchema, default: () => ({}) },
    status: {
      type: String,
      required: true,
      enum: ['lead', 'active', 'inactive', 'churned'],
      default: 'lead',
    },
    churnReason: { type: String, maxlength: 500, default: null },
    source: {
      type: String,
      required: true,
      enum: [
        'referral',
        'linkedin',
        'website',
        'cold_outreach',
        'upwork',
        'fiverr',
        'google_ads',
        'event',
        'other',
      ],
      default: 'other',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator(v) {
          return !v || v.length <= 10;
        },
        message: 'Maximum 10 tags allowed',
      },
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: { type: String, maxlength: 3000, default: null },
    totalRevenue: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'PKR', maxlength: 3 },
    avatar: { type: String, default: null },
    lastContactedAt: { type: Date, default: null },
    nextFollowUpAt: { type: Date, default: null },
    deleteReason: { type: String, maxlength: 500, default: null },
    restoreDeadline: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  baseSchemaOptions
);

/* ── Soft Delete Plugin ─────────────────────────────────────────────── */
clientSchema.plugin(softDeletePlugin);

/* ── Virtuals ───────────────────────────────────────────────────────── */
clientSchema.virtual('primaryContact').get(function getPrimary() {
  if (!this.contacts || this.contacts.length === 0) return null;
  return this.contacts.find((c) => c.isPrimary) || this.contacts[0];
});

clientSchema.virtual('displayName').get(function getDisplayName() {
  return this.companyName;
});

clientSchema.virtual('isRestoreable').get(function getIsRestoreable() {
  return this.restoreDeadline && this.restoreDeadline > Date.now();
});

/* ── Pre-Save Hooks ─────────────────────────────────────────────────── */
clientSchema.pre('save', async function preSave(next) {
  // 1. Auto-generate slug
  if (this.isModified('companyName') || !this.slug) {
    let base = this.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let slug = base;
    let counter = 1;
    const Model = this.constructor;
    // eslint-disable-next-line no-await-in-loop
    while (
      await Model.findOne({ slug, _id: { $ne: this._id }, isDeleted: { $in: [true, false] } })
    ) {
      counter += 1;
      slug = `${base}-${counter}`;
    }
    this.slug = slug;
  }

  // 2. Ensure exactly one primary contact
  if (this.contacts && this.contacts.length > 0) {
    const primaries = this.contacts.filter((c) => c.isPrimary);
    if (primaries.length === 0) {
      this.contacts[0].isPrimary = true;
    } else if (primaries.length > 1) {
      // Keep only the last set primary
      this.contacts.forEach((c) => {
        c.isPrimary = false;
      });
      primaries[primaries.length - 1].isPrimary = true;
    }
  }

  // 3. Tags cleanup: lowercase, trim, deduplicate
  if (this.tags && this.tags.length > 0) {
    this.tags = [...new Set(this.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    if (this.tags.length > 10) this.tags = this.tags.slice(0, 10);
  }

  // 4. Validate churnReason when status is churned
  if (this.status === 'churned' && !this.churnReason) {
    return next(new Error('Churn reason is required when status is churned'));
  }

  return next();
});

/* ── Indexes ────────────────────────────────────────────────────────── */
clientSchema.index(
  { companyName: 'text', 'contacts.name': 'text', 'contacts.email': 'text' },
  { name: 'client_text_search' }
);
clientSchema.index({ status: 1, isDeleted: 1 });
clientSchema.index({ assignedTo: 1, isDeleted: 1 });
clientSchema.index({ tags: 1 });
clientSchema.index({ industry: 1 });
clientSchema.index({ source: 1 });
clientSchema.index({ createdBy: 1 });
clientSchema.index({ 'contacts.email': 1 });
clientSchema.index({ restoreDeadline: 1 });
clientSchema.index({ createdAt: -1 });

/* ── Static Methods ─────────────────────────────────────────────────── */
clientSchema.statics.findActive = function findActive(filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

clientSchema.statics.findDeleted = function findDeleted(filter = {}) {
  return this.find({ ...filter, isDeleted: true });
};

clientSchema.statics.search = function search(query, filters = {}) {
  const filter = { isDeleted: filters.deleted || false };

  if (query) {
    filter.$or = [
      { companyName: { $regex: query, $options: 'i' } },
      { 'contacts.name': { $regex: query, $options: 'i' } },
      { 'contacts.email': { $regex: query, $options: 'i' } },
    ];
  }

  if (filters.status) filter.status = filters.status;
  if (filters.industry) filter.industry = filters.industry;
  if (filters.source) filter.source = filters.source;
  if (filters.assignedTo) filter.assignedTo = filters.assignedTo;
  if (filters.tags) {
    const tagArr = Array.isArray(filters.tags)
      ? filters.tags
      : filters.tags.split(',').map((t) => t.trim());
    filter.tags = { $all: tagArr };
  }

  return this.find(filter);
};

export default mongoose.model('Client', clientSchema);
