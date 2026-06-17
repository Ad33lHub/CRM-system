import asyncHandler from '../utils/asyncHandler.js';
import Settings from '../models/Settings.model.js';
import User from '../models/User.model.js';
import { createNotification } from '../services/notification.service.js';
import { successResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * GET /api/settings
 * Return the global settings singleton (Super Admin only).
 */
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  return successResponse(res, settings, 'Settings fetched successfully');
});

/**
 * PATCH /api/settings
 * Update one or more settings groups (Super Admin only).
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const { organization, invoiceDefaults, security } = req.body;

  if (organization) {
    Object.assign(settings.organization, organization);
    settings.markModified('organization');
  }
  if (invoiceDefaults) {
    Object.assign(settings.invoiceDefaults, invoiceDefaults);
    settings.markModified('invoiceDefaults');
  }
  if (security) {
    Object.assign(settings.security, security);
    settings.markModified('security');
  }

  settings.updatedBy = req.user._id;
  await settings.save();

  logger.info('settings.updated', {
    userId: req.user._id,
    groups: Object.keys(req.body),
  });

  return successResponse(res, settings, 'Settings updated successfully');
});

/**
 * POST /api/settings/broadcast
 * Send a system-wide notification to all active staff (Super Admin only).
 */
export const broadcast = asyncHandler(async (req, res) => {
  const { title, message, priority } = req.body;

  const users = await User.find({ isActive: true, role: { $ne: 'client' } }).select('_id');
  await Promise.all(
    users.map((u) =>
      createNotification({
        recipient: u._id,
        type: 'system',
        title,
        message,
        priority: priority || 'normal',
      })
    )
  );

  logger.info('settings.broadcast', { userId: req.user._id, recipients: users.length });

  return successResponse(
    res,
    { recipients: users.length },
    `Broadcast sent to ${users.length} users`
  );
});
