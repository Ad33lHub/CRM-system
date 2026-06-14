import mongoose from 'mongoose';

/**
 * Global Mongoose configuration.
 * Imported once (via models/index.js) so every schema picks up the same defaults.
 */

// Warn on querying fields not defined in the schema.
mongoose.set('strictQuery', true);

/**
 * Shared transform: expose `id` (string) instead of `_id`, drop `__v`.
 * Applied through baseSchemaOptions below and the global defaults.
 */
const stripInternalFields = (doc, ret) => {
  delete ret._id;
  return ret;
};

mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: stripInternalFields,
});

mongoose.set('toObject', {
  virtuals: true,
  versionKey: false,
});

/**
 * Standard options applied to every schema in the project.
 * - timestamps adds createdAt / updatedAt
 * - virtuals are serialised in both toJSON and toObject
 * - versionKey (__v) is hidden from JSON output
 */
export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: stripInternalFields,
  },
  toObject: {
    virtuals: true,
    versionKey: false,
  },
};

/**
 * Soft-delete plugin.
 * Adds isDeleted / deletedAt / deletedBy, an instance softDelete() method,
 * a findActive() static, and pre-find hooks that transparently exclude
 * soft-deleted documents from normal queries.
 *
 * To explicitly include soft-deleted docs, pass `isDeleted` in the filter
 * (e.g. Model.find({ isDeleted: true })).
 */
export const softDeletePlugin = (schema) => {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  });

  schema.methods.softDelete = function softDelete(userId = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
  };

  schema.methods.restore = function restore() {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };

  schema.statics.findActive = function findActive(filter = {}) {
    return this.find({ ...filter, isDeleted: { $ne: true } });
  };

  const excludeDeleted = function excludeDeleted(next) {
    const filter = this.getFilter();
    if (!Object.prototype.hasOwnProperty.call(filter, 'isDeleted')) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  };

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);
  schema.pre('count', excludeDeleted);
};

export default mongoose;
