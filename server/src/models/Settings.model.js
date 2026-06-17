import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

/**
 * Global system settings.
 *
 * Stored as a single document (a "singleton") — there is only ever one row.
 * Use `Settings.getSingleton()` to read/create it. Managed by Super Admin only.
 * Secrets (SMTP password, API keys) live in env/config, never here.
 */
const settingsSchema = new mongoose.Schema(
  {
    // Marker that enforces a single document (unique).
    key: { type: String, default: 'global', unique: true, immutable: true },

    organization: {
      companyName: { type: String, default: 'Verixsoft', maxlength: 120 },
      address: { type: String, default: '', maxlength: 300 },
      supportEmail: { type: String, default: '', maxlength: 160 },
      logoUrl: { type: String, default: '', maxlength: 500 },
    },

    invoiceDefaults: {
      currency: { type: String, default: 'USD', maxlength: 8 },
      taxRate: { type: Number, default: 0, min: 0, max: 100 },
      invoicePrefix: { type: String, default: 'INV-', maxlength: 12 },
      paymentTermsDays: { type: Number, default: 14, min: 0, max: 365 },
      footerNote: { type: String, default: '', maxlength: 500 },
    },

    security: {
      maxLoginAttempts: { type: Number, default: 5, min: 3, max: 20 },
      lockoutMinutes: { type: Number, default: 120, min: 5, max: 1440 },
      sessionTimeoutMinutes: { type: Number, default: 60, min: 5, max: 1440 },
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  baseSchemaOptions
);

/**
 * Return the single settings document, creating it with defaults if missing.
 */
settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) {
    doc = await this.create({ key: 'global' });
  }
  return doc;
};

export default mongoose.model('Settings', settingsSchema);
