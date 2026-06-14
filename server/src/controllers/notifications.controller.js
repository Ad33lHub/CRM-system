import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import {
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, isRead } = req.query;
  const { skip, limit: lim, page: pg } = getPaginationParams({ page, limit });

  const filter = { recipient: req.user._id };
  if (type) filter.type = type;
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const [notifications, total, unreadData] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
    Notification.countDocuments(filter),
    getUnreadCount(req.user._id),
  ]);

  const pagination = buildPaginationMeta(total, pg, lim);

  return paginatedResponse(
    res,
    { notifications, unreadCount: unreadData.total, unreadByType: unreadData.byType },
    pagination,
    'Notifications fetched'
  );
});

export const getUnreadCountHandler = asyncHandler(async (req, res) => {
  const data = await getUnreadCount(req.user._id);
  return successResponse(res, data, 'Unread count fetched');
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.params.id, req.user._id);
  if (!notification) return errorResponse(res, 'Notification not found', 404);
  return successResponse(res, notification, 'Notification marked as read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  const { type } = req.body;
  const result = await markAllNotificationsRead(req.user._id, type || null);
  return successResponse(
    res,
    { modifiedCount: result.modifiedCount },
    `${result.modifiedCount} notifications marked as read`
  );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  return successResponse(res, null, 'Notification deleted');
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id, isRead: true });
  return successResponse(res, null, 'Read notifications cleared');
});

export default {
  getNotifications,
  getUnreadCountHandler,
  markRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
};
