import mongoose from 'mongoose';
import { baseSchemaOptions } from '../config/mongoose.js';

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, default: null },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'half_day', 'remote'],
      default: 'present',
    },
    ipAddress: { type: String },
    location: { type: String },
  },
  baseSchemaOptions
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
