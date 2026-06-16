import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  successResponse,
  conflict,
  forbidden,
  unauthorised,
  errorResponse,
} from '../utils/apiResponse.js';
import User from '../models/User.model.js';
import AuditLog from '../models/AuditLog.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import { sanitizeUser } from '../utils/sanitizeResponse.js';
import logger from '../utils/logger.js';
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
} from '../services/token.service.js';
import config from '../config/env.js';
import { queueEmail, otpTemplate } from '../services/email.service.js';

/**
 * Register a new user profile
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  // Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return conflict(res, 'Email already registered');
  }

  // Role assignment validation
  let targetRole = role || 'developer';
  if (!req.user) {
    // Public registration forces role to 'developer'
    targetRole = 'developer';
  } else {
    // Authenticated user attempting registration
    if (['super_admin', 'admin'].includes(targetRole) && req.user.role !== 'super_admin') {
      return forbidden(res, 'Insufficient permissions to assign this role');
    }
  }

  // Create new user profile
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: targetRole,
    phone,
  });

  // Log to AuditLog
  await AuditLog.create({
    action: 'user.registered',
    entity: 'User',
    entityId: newUser._id,
    performedBy: req.user?._id || newUser._id,
    ipAddress: req.ip,
  });

  // Return success response with 201 status
  return successResponse(
    res,
    {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      isEmailVerified: newUser.isEmailVerified,
      createdAt: newUser.createdAt,
    },
    'Registration successful',
    201
  );
});

/**
 * Authenticate user credentials and return access/refresh tokens
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and explicitly select security and password fields
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
  if (!user) {
    return unauthorised(res, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked()) {
    return errorResponse(
      res,
      'Account locked due to too many failed attempts. Try again after 2 hours.',
      423
    );
  }

  // Check if account is active
  if (!user.isActive) {
    return forbidden(res, 'Account deactivated. Contact admin.');
  }

  // Verify password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    if (user.loginAttempts >= 5) {
      logger.warn('auth.account_locked', { userId: user._id, ip: req.ip });
      return errorResponse(res, 'Account locked after 5 failed attempts', 423);
    }
    logger.warn('auth.login_failed', { userId: user._id, ip: req.ip });
    return unauthorised(res, 'Invalid email or password');
  }

  // Reset login attempts on successful login
  await User.updateOne(
    { _id: user._id },
    { $set: { loginAttempts: 0, lockUntil: null, lastLogin: new Date() } }
  );

  // Generate access and refresh tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id, req.ip, req.headers['user-agent']);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  // Log successful login to AuditLog
  await AuditLog.create({
    action: 'user.login',
    entity: 'User',
    entityId: user._id,
    performedBy: user._id,
    ipAddress: req.ip,
    metadata: { userAgent: req.headers['user-agent'] },
  });

  return successResponse(
    res,
    {
      accessToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        managerType: user.managerType ?? null,
        clientId: user.clientId ?? null,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    },
    'Login successful'
  );
});

/**
 * Rotate refresh tokens
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const rawToken = req.cookies.refreshToken;
  if (!rawToken) {
    return unauthorised(res, 'No refresh token provided');
  }

  // Rotate token internally (checks validity, expiration, and token reuse)
  const { newRawToken, userId } = await rotateRefreshToken(
    rawToken,
    req.ip,
    req.headers['user-agent']
  );

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    return unauthorised(res, 'User not found or deactivated');
  }

  const newAccessToken = generateAccessToken(user);

  res.cookie('refreshToken', newRawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, { accessToken: newAccessToken }, 'Token refreshed');
});

/**
 * Clear refresh token cookie and invalidate it in DB
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies.refreshToken;
  if (rawToken) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await RefreshToken.updateOne({ token: hashedToken }, { $set: { isValid: false } });
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  return successResponse(res, null, 'Logged out successfully');
});

/**
 * Revoke all active refresh tokens for the authenticated user
 * POST /api/auth/logout-all
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await revokeAllUserTokens(req.user._id);

  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  return successResponse(res, null, 'Logged out from all devices');
});

/**
 * Initiate password reset request
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return successResponse(
      res,
      null,
      'If a matching profile exists, a password reset link has been sent.'
    );
  }

  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const resetUrl = `${config.CLIENT_URL}/reset-password?token=${plainToken}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
  });

  await queueEmail({
    to: user.email,
    subject: 'Password Reset Request',
    templateName: 'passwordReset',
    templateVars: {
      recipientName: user.firstName,
      resetUrl,
      expiresIn: '15 minutes',
      expiresAt,
      unsubscribeUrl: '',
    },
  });

  await AuditLog.create({
    action: 'user.password_reset_requested',
    entity: 'User',
    entityId: user._id,
    performedBy: user._id,
    ipAddress: req.ip,
  });

  return successResponse(
    res,
    null,
    'If a matching profile exists, a password reset link has been sent.'
  );
});

/**
 * Execute password reset
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return errorResponse(res, 'Invalid or expired reset token', 400);
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  await AuditLog.create({
    action: 'user.password_reset_completed',
    entity: 'User',
    entityId: user._id,
    performedBy: user._id,
    ipAddress: req.ip,
  });

  return successResponse(res, null, 'Password reset successful');
});

/**
 * Get currently authenticated user details
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user || !user.isActive) {
    return unauthorised(res, 'User not found or deactivated');
  }
  return successResponse(res, sanitizeUser(user), 'Profile fetched successfully');
});

/**
 * Update the authenticated user's own profile (name, phone).
 * PATCH /api/auth/me
 */
export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user || !user.isActive) {
    return unauthorised(res, 'User not found or deactivated');
  }

  const { firstName, lastName, phone } = req.body;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  await user.save();

  await AuditLog.create({
    action: 'user.profile_updated',
    entity: 'User',
    entityId: user._id,
    performedBy: user._id,
    ipAddress: req.ip,
  }).catch(() => {});

  return successResponse(res, sanitizeUser(user.toObject()), 'Profile updated successfully');
});

/**
 * Change the authenticated user's password (requires the current password).
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !user.isActive) {
    return unauthorised(res, 'User not found or deactivated');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return unauthorised(res, 'Current password is incorrect');
  }

  user.password = newPassword; // pre-save hook re-hashes
  await user.save();

  await AuditLog.create({
    action: 'user.password_changed',
    entity: 'User',
    entityId: user._id,
    performedBy: user._id,
    ipAddress: req.ip,
  }).catch(() => {});

  return successResponse(res, { id: user._id }, 'Password changed successfully');
});

/**
 * Generate and send email verification OTP
 * GET /api/auth/send-otp
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user || !user.isActive) {
    return unauthorised(res, 'User not found or deactivated');
  }

  const otpVal = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash('sha256').update(otpVal).digest('hex');

  user.emailVerificationOtp = hashedOtp;
  user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  const html = otpTemplate({
    otp: otpVal,
    firstName: user.firstName,
    expiryMinutes: 10,
  });

  await queueEmail({
    to: user.email,
    subject: 'Email Verification OTP',
    html,
  });

  return successResponse(res, null, 'OTP sent successfully');
});

/**
 * Verify email verification OTP
 * POST /api/auth/verify-otp
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.findById(req.user._id).select(
    '+emailVerificationOtp +emailVerificationOtpExpires'
  );

  if (!user) {
    return unauthorised(res, 'User not found');
  }

  if (
    !user.emailVerificationOtp ||
    user.emailVerificationOtp !== hashedOtp ||
    !user.emailVerificationOtpExpires ||
    user.emailVerificationOtpExpires.getTime() < Date.now()
  ) {
    return errorResponse(res, 'Invalid or expired OTP', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationOtp = null;
  user.emailVerificationOtpExpires = null;
  await user.save();

  return successResponse(res, null, 'Email verified successfully');
});

export default {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  changePassword,
  sendOTP,
  verifyOTP,
};
