import Attendance from '../models/Attendance.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';

export const getAttendanceLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};

  // If user is client, deny access
  if (req.user.role === 'client') {
    return errorResponse(res, 'Access denied', 403);
  }

  // Non-managers/admins can only see their own attendance
  if (!['super_admin', 'admin', 'manager'].includes(req.user.role)) {
    filter.user = req.user._id;
  } else if (req.query.userId) {
    filter.user = req.query.userId;
  }

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email avatar role'),
    Attendance.countDocuments(filter),
  ]);

  return paginatedResponse(res, items, page, limit, total, 'Attendance logs fetched successfully');
});

export const checkIn = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Check if already checked in today
  const existing = await Attendance.findOne({ user: userId, date: today });
  if (existing) {
    return errorResponse(res, 'Already checked in today', 400);
  }

  // Determine status (late if checked in after 9:30 AM local time)
  // Let's assume office starts at 9:30 AM.
  const checkInTime = new Date();
  const hours = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  const isLate = hours > 9 || (hours === 9 && minutes > 30);

  const log = await Attendance.create({
    user: userId,
    date: today,
    checkIn: checkInTime,
    status: isLate ? 'late' : 'present',
    ipAddress: req.ip,
  });

  return successResponse(res, log, 'Checked in successfully', 201);
});

export const checkOut = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const log = await Attendance.findOne({ user: userId, date: today });
  if (!log) {
    return errorResponse(res, 'No check-in log found for today', 404);
  }

  if (log.checkOut) {
    return errorResponse(res, 'Already checked out today', 400);
  }

  log.checkOut = new Date();
  await log.save();

  return successResponse(res, log, 'Checked out successfully');
});
