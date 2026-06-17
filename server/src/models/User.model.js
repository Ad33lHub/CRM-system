import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config/env.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => EMAIL_REGEX.test(value),
        message: 'Invalid email address',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['super_admin', 'admin', 'manager', 'developer', 'designer', 'qa_engineer', 'client'],
    },
    // Manager specialization — only meaningful when role === 'manager'.
    // 'lead_manager' handles the leads pipeline; 'project_manager' runs projects;
    // 'hiring_manager' can register new employees.
    managerType: {
      type: String,
      enum: ['lead_manager', 'project_manager', 'hiring_manager', null],
      default: null,
    },
    // For client-portal logins: the Client company this account represents.
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
    },
    emailVerificationOtp: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationOtpExpires: {
      type: Date,
      select: false,
      default: null,
    },
    refreshTokens: {
      type: [
        {
          token: { type: String },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function getFullName() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lockUntil: 1 });

// Pre-save hook
userSchema.pre('save', async function hashPassword(next) {
  if (this.isModified('firstName') && this.firstName) {
    this.firstName = this.firstName.trim();
  }
  if (this.isModified('lastName') && this.lastName) {
    this.lastName = this.lastName.trim();
  }

  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS || 12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance methods
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

userSchema.methods.incrementLoginAttempts = function incrementLoginAttempts(
  maxAttempts = 5,
  lockoutMinutes = 120
) {
  if (this.lockUntil && this.lockUntil.getTime() < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
  } else {
    this.loginAttempts += 1;
  }

  if (this.loginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
  }

  return this.save();
};

export default mongoose.model('User', userSchema);
