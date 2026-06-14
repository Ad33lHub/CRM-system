import Employee from '../models/Employee.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';
import { queueEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';
import { sanitizeEmployee, sanitizeEmployees } from '../utils/sanitizeResponse.js';

async function triggerWelcomeEmail(employee) {
  try {
    const { default: User } = await import('../models/User.model.js');
    const user = await User.findById(employee.user).select('name firstName lastName email').lean();
    if (!user?.email) return;

    const employeeName = user.name || `${user.firstName} ${user.lastName}`;

    await queueEmail({
      to: user.email,
      subject: `Welcome to ${employee.department || 'the team'}, ${user.firstName}!`,
      templateName: 'welcome',
      templateVars: {
        employeeName,
        employeeId: employee.employeeId || employee._id.toString(),
        department: employee.department || 'General',
        jobTitle: employee.jobTitle || 'Team Member',
        startDate: employee.hireDate
          ? new Date(employee.hireDate).toLocaleDateString('en-PK')
          : new Date().toLocaleDateString('en-PK'),
        loginUrl: `${process.env.APP_URL || ''}/login`,
        unsubscribeUrl: '',
      },
    });
  } catch (err) {
    logger.error(`Welcome email failed for employee ${employee._id}: ${err.message}`);
  }
}

export const listEmployees = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.status && req.query.status !== 'all' && req.query.status !== 'undefined') {
    filter.isActive = req.query.status === 'active';
  }
  const [items, total] = await Promise.all([
    Employee.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email avatar role'),
    Employee.countDocuments(filter),
  ]);
  return paginatedResponse(
    res,
    sanitizeEmployees(items),
    page,
    limit,
    total,
    'Employee list fetched successfully'
  );
});

export const getEmployee = asyncHandler(async (req, res) => {
  const doc = await Employee.findById(req.params.id)
    .populate('user', 'firstName lastName email avatar role')
    .lean();
  if (!doc) return errorResponse(res, 'Employee not found', 404);
  return successResponse(res, sanitizeEmployee(doc), 'Employee fetched successfully');
});

export const createEmployee = asyncHandler(async (req, res) => {
  const doc = await Employee.create(req.body);

  triggerWelcomeEmail(doc).catch(() => {});

  return successResponse(
    res,
    sanitizeEmployee(doc.toObject()),
    'Employee created successfully',
    201
  );
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const doc = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    lean: true,
  });
  if (!doc) return errorResponse(res, 'Employee not found', 404);
  return successResponse(res, sanitizeEmployee(doc), 'Employee updated successfully');
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const doc = await Employee.findByIdAndDelete(req.params.id);
  if (!doc) return errorResponse(res, 'Employee not found', 404);
  return successResponse(res, { id: req.params.id }, 'Employee deleted successfully');
});
