import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/env.js';
import RefreshToken from '../models/RefreshToken.model.js';
import AppError, { ERROR_CODES } from '../utils/AppError.js';

/**
 * Generate JWT access token for authentication
 * @param {Object} user - User document
 * @returns {String} access token
 */
export const generateAccessToken = (user) => {
  // Production: replace secret with privateKey from env
  // algorithm: 'RS256', use fs.readFileSync for key files
  return jwt.sign({ sub: user._id, email: user.email, role: user.role }, config.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: config.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

/**
 * Verify access token signatures
 * @param {String} token - Access token
 * @returns {Object} decoded payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const error = new Error('Token expired');
      error.status = 401;
      error.statusCode = 401;
      throw error;
    }
    if (err.name === 'JsonWebTokenError') {
      const error = new Error('Invalid token');
      error.status = 401;
      error.statusCode = 401;
      throw error;
    }
    throw err;
  }
};

/**
 * Generate a new refresh token family member and save its hash
 * @param {String} userId - User ID
 * @param {String} ipAddress - Request IP
 * @param {String} userAgent - Request user agent
 * @returns {String} raw token to return to the client
 */
export const generateRefreshToken = async (userId, ipAddress, userAgent) => {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const family = crypto.randomUUID();

  await RefreshToken.create({
    token: hashedToken,
    user: userId,
    family,
    isValid: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress,
    userAgent,
  });

  return rawToken;
};

/**
 * Rotate refresh tokens and check for token reuse
 * @param {String} rawToken - Input raw refresh token
 * @param {String} ipAddress - Request IP
 * @param {String} userAgent - Request user agent
 * @returns {Object} new token details
 */
export const rotateRefreshToken = async (rawToken, ipAddress, userAgent) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const existingToken = await RefreshToken.findOne({ token: hashedToken });
  if (!existingToken) {
    throw new AppError('Invalid refresh token', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // Reuse detection: If token is already invalid, invalidate the entire family
  if (!existingToken.isValid) {
    await RefreshToken.updateMany({ family: existingToken.family }, { isValid: false });
    throw new AppError(
      'Token reuse detected — please login again',
      401,
      ERROR_CODES.SESSION_EXPIRED
    );
  }

  // Check expiration
  if (existingToken.expiresAt.getTime() < Date.now()) {
    throw new AppError('Refresh token expired', 401, ERROR_CODES.SESSION_EXPIRED);
  }

  // Invalidate old token
  existingToken.isValid = false;
  await existingToken.save();

  // Generate new raw refresh token and hash it
  const newRawToken = crypto.randomBytes(64).toString('hex');
  const newHashedToken = crypto.createHash('sha256').update(newRawToken).digest('hex');

  await RefreshToken.create({
    token: newHashedToken,
    user: existingToken.user,
    family: existingToken.family,
    isValid: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress,
    userAgent,
  });

  return { newRawToken, userId: existingToken.user };
};

/**
 * Revoke all tokens for a user (e.g. force logout all devices)
 * @param {String} userId - User ID
 */
export const revokeAllUserTokens = async (userId) => {
  return RefreshToken.updateMany({ user: userId }, { isValid: false });
};
