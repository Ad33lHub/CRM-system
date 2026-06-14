import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import Employee from '../models/Employee.model.js';
import * as employeeService from '../services/employeeAnalytics.service.js';

const ADMIN_ROLES = ['super_admin', 'admin', 'manager'];

export const getEmployeeReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const period = req.query.period || 'last_30d';
  const { role, _id: userId } = req.user;

  if (!ADMIN_ROLES.includes(role)) {
    const emp = await Employee.findOne({ user: userId }).lean();
    if (!emp || (emp._id.toString() !== id && emp.user.toString() !== id)) {
      return errorResponse(res, 'Access denied', 403);
    }
  }

  let employeeUserId = id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 'Invalid employee ID', 400);
  }

  const emp = await Employee.findOne({
    $or: [{ _id: id }, { user: id }],
  })
    .populate('user', 'firstName lastName email avatar')
    .lean();

  if (!emp) return errorResponse(res, 'Employee not found', 404);

  employeeUserId = emp.user._id;
  const metrics = await employeeService.getProductivityMetrics(employeeUserId, period);
  const weekly = await employeeService.getWeeklyTrend(employeeUserId, 12);

  return successResponse(
    res,
    {
      employee: {
        _id: emp._id,
        employeeId: emp.employeeId,
        name: `${emp.user.firstName} ${emp.user.lastName}`,
        email: emp.user.email,
        avatar: emp.user.avatar,
        department: emp.department,
        designation: emp.designation,
      },
      metrics,
      weekly,
    },
    'Employee report fetched'
  );
});

export const getTeamReport = asyncHandler(async (req, res) => {
  const { department, period = 'last_30d' } = req.query;
  const data = await employeeService.getTeamProductivitySummary(period, department);
  return successResponse(res, data, 'Team report fetched');
});

export const getEmployeeRanking = asyncHandler(async (req, res) => {
  const { metric = 'completionRate', period = 'last_30d' } = req.query;
  const data = await employeeService.getEmployeeRanking(metric, period);
  return successResponse(res, data, 'Ranking fetched');
});
