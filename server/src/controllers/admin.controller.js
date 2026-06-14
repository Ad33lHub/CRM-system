import User from '../models/User.model.js';
import AuditLog from '../models/AuditLog.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';

export const getPresenceList = asyncHandler(async (req, res) => {
  // Retrieve active users. Since presence updates in real time,
  // we can select users that are active or simulate online status.
  const users = await User.find({ isActive: true })
    .select('firstName lastName email avatar role lastLogin')
    .sort({ lastLogin: -1 });

  // Simulate online presence based on recent login (last 2 hours)
  const presenceUsers = users.map((u) => {
    const isOnline =
      u.lastLogin && Date.now() - new Date(u.lastLogin).getTime() < 2 * 60 * 60 * 1000;
    return {
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      lastLogin: u.lastLogin,
      isOnline: !!isOnline,
    };
  });

  return successResponse(res, presenceUsers, 'Presence list fetched successfully');
});

export const getActivityDashboard = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const [items, total] = await Promise.all([
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'firstName lastName email role'),
    AuditLog.countDocuments({}),
  ]);

  return paginatedResponse(res, items, page, limit, total, 'Audit logs fetched successfully');
});
