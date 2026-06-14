import Notification from '../models/Notification.model.js';
import { getIO } from '../config/socket.js';
import logger from '../utils/logger.js';

const BATCH_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Create or batch a notification, then emit via Socket.IO.
 *
 * Batching: if a notification with the same groupKey exists for the recipient
 * within the last 30 minutes and is unread, increment its batchCount instead
 * of creating a duplicate.
 */
export async function createNotification({
  recipient,
  type,
  title,
  message,
  link,
  metadata,
  groupKey,
  priority = 'normal',
  expiresAt,
}) {
  let notification;
  let batched = false;

  if (groupKey) {
    const windowStart = new Date(Date.now() - BATCH_WINDOW_MS);
    const existing = await Notification.findOne({
      recipient,
      groupKey,
      isRead: false,
      createdAt: { $gte: windowStart },
    }).sort({ createdAt: -1 });

    if (existing) {
      existing.batchCount += 1;
      existing.message = message;
      existing.updatedAt = new Date();
      await existing.save();
      notification = existing;
      batched = true;
    }
  }

  if (!notification) {
    notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata || {},
      isRead: false,
      groupKey: groupKey || null,
      batchCount: 1,
      priority,
      expiresAt: expiresAt || null,
    });
  }

  try {
    const io = getIO();
    io.to(`user:${recipient.toString()}`).emit('notification:new', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      metadata: notification.metadata,
      isRead: false,
      batchCount: notification.batchCount,
      priority: notification.priority,
      batched,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    logger.warn(`Socket emit failed for notification ${notification._id}: ${err.message}`);
  }

  return notification;
}

/**
 * Notify multiple recipients with the same payload.
 */
export async function notifyMultiple(recipientIds, payload) {
  const results = await Promise.allSettled(
    recipientIds.map((recipientId) => createNotification({ ...payload, recipient: recipientId }))
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error(`Failed to notify user ${recipientIds[index]}: ${result.reason?.message}`);
    }
  });

  return results;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (notification) {
    try {
      const io = getIO();
      io.to(`user:${userId.toString()}`).emit('notification:read', notificationId);
    } catch {
      // Socket emit is best-effort
    }
  }

  return notification;
}

/**
 * Mark all (or filtered by type) notifications as read for a user.
 */
export async function markAllNotificationsRead(userId, type = null) {
  const filter = { recipient: userId, isRead: false };
  if (type) filter.type = type;

  const result = await Notification.updateMany(filter, { isRead: true, readAt: new Date() });

  try {
    const io = getIO();
    io.to(`user:${userId.toString()}`).emit('notification:read-all', { type });
  } catch {
    // Socket emit is best-effort
  }

  return result;
}

/**
 * Get unread count and grouped counts by type for a user.
 */
export async function getUnreadCount(userId) {
  const [total, grouped] = await Promise.all([
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.aggregate([
      {
        $match: {
          recipient: new (await import('mongoose')).default.Types.ObjectId(userId),
          isRead: false,
        },
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]);

  const byType = {};
  grouped.forEach((g) => {
    byType[g._id] = g.count;
  });

  return { total, byType };
}

export default {
  createNotification,
  notifyMultiple,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
};
