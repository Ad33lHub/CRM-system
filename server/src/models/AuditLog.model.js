import mongoose from 'mongoose';

/**
 * Audit logs are append-only and immutable.
 * Documents may be created but never updated or deleted via the model layer.
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

// Prevent any modification of an existing audit log document.
auditLogSchema.pre('save', function blockUpdates(next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable and cannot be modified'));
  }
  return next();
});

const blockUpdateOperation = function blockUpdateOperation(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
};

const blockDeleteOperation = function blockDeleteOperation(next) {
  next(new Error('Audit logs are immutable and cannot be deleted'));
};

auditLogSchema.pre('updateOne', blockUpdateOperation);
auditLogSchema.pre('updateMany', blockUpdateOperation);
auditLogSchema.pre('findOneAndUpdate', blockUpdateOperation);
auditLogSchema.pre('deleteOne', blockDeleteOperation);
auditLogSchema.pre('deleteMany', blockDeleteOperation);
auditLogSchema.pre('findOneAndDelete', blockDeleteOperation);

export default mongoose.model('AuditLog', auditLogSchema);
