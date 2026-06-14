import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const documentSchema = new mongoose.Schema(
  {
    type: { type: String },
    url: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, unique: true },
    department: {
      type: String,
      enum: ['engineering', 'design', 'qa', 'management', 'sales', 'hr', 'finance'],
      required: true,
    },
    designation: { type: String, required: true, trim: true },
    joinDate: { type: Date, required: true },
    skills: { type: [String], default: [] },
    salary: {
      amount: { type: Number, default: 0, select: false },
      currency: { type: String, default: 'PKR' },
      type: { type: String, enum: ['monthly', 'hourly'], default: 'monthly' },
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    documents: { type: [documentSchema], default: [] },
    leaveBalance: {
      annual: { type: Number, default: 20 },
      sick: { type: Number, default: 10 },
      casual: { type: Number, default: 5 },
    },
    isActive: { type: Boolean, default: true },
    terminatedAt: { type: Date, default: null },
    terminationReason: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions
);

// user and employeeId unique indexes are created by their field-level `unique: true` above.
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });

// Auto-generate employeeId (EMP-0001) before validation.
employeeSchema.pre('validate', async function generateEmployeeId(next) {
  try {
    if (this.isNew && !this.employeeId) {
      const prefix = 'EMP-';
      const last = await this.constructor
        .findOne({ employeeId: new RegExp(`^${prefix}`) })
        .sort({ employeeId: -1 })
        .lean();
      let seq = 1;
      if (last && last.employeeId) {
        seq = parseInt(last.employeeId.split('-')[1], 10) + 1;
      }
      this.employeeId = `${prefix}${String(seq).padStart(4, '0')}`;
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

export default mongoose.model('Employee', employeeSchema);
