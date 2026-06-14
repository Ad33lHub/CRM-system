import Task from '../models/Task.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';
import { createNotification } from '../services/notification.service.js';
import { queueEmail } from '../services/email.service.js';
import { clearEmployeeCache } from '../services/employeeAnalytics.service.js';

async function triggerTaskAssigned(task, assigneeId) {
  try {
    const { default: User } = await import('../models/User.model.js');
    const assignee = await User.findById(assigneeId).select('name firstName lastName email').lean();
    if (!assignee) return;

    const assigneeName = assignee.name || `${assignee.firstName} ${assignee.lastName}`;
    const assigneeEmail = assignee.email;

    await createNotification({
      recipient: assigneeId,
      type: 'task',
      title: 'New task assigned',
      message: `You have been assigned to: "${task.title}"`,
      link: `/tasks/${task._id}`,
      groupKey: `task:${task._id}:assigned`,
      priority: task.priority === 'urgent' ? 'urgent' : 'normal',
    });

    if (assigneeEmail) {
      const PRIORITY_COLORS = {
        low: '6B7280',
        medium: 'D97706',
        high: 'DC2626',
        urgent: '7C3AED',
      };
      await queueEmail({
        to: assigneeEmail,
        subject: `Task assigned: ${task.title}`,
        templateName: 'taskAssigned',
        templateVars: {
          assigneeName,
          taskTitle: task.title,
          priority: task.priority || 'medium',
          priorityColor: PRIORITY_COLORS[task.priority] || 'D97706',
          dueDate: task.dueDate
            ? new Date(task.dueDate).toLocaleDateString('en-PK')
            : 'No due date',
          taskUrl: `${process.env.APP_URL || ''}/tasks/${task._id}`,
          unsubscribeUrl: '',
        },
      });
    }
  } catch (err) {
    const { default: logger } = await import('../utils/logger.js');
    logger.error(`Task assigned notification failed: ${err.message}`);
  }
}

export const listTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Task.countDocuments(filter),
  ]);
  return paginatedResponse(res, items, page, limit, total, 'Task list fetched successfully');
});

export const getTask = asyncHandler(async (req, res) => {
  const doc = await Task.findById(req.params.id);
  if (!doc) return errorResponse(res, 'Task not found', 404);
  return successResponse(res, doc, 'Task fetched successfully');
});

export const createTask = asyncHandler(async (req, res) => {
  const doc = await Task.create(req.body);

  if (doc.assignedTo) {
    triggerTaskAssigned(doc, doc.assignedTo).catch(() => {});
  }

  return successResponse(res, doc, 'Task created successfully', 201);
});

export const updateTask = asyncHandler(async (req, res) => {
  const previous = await Task.findById(req.params.id).lean();
  const doc = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) return errorResponse(res, 'Task not found', 404);

  const prevAssignee = previous?.assignedTo?.toString();
  const newAssignee = doc.assignedTo?.toString();
  if (newAssignee && newAssignee !== prevAssignee) {
    triggerTaskAssigned(doc, doc.assignedTo).catch(() => {});
  }

  if (doc.status === 'done' && previous?.status !== 'done') {
    clearEmployeeCache().catch(() => {});
  }

  return successResponse(res, doc, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const doc = await Task.findByIdAndDelete(req.params.id);
  if (!doc) return errorResponse(res, 'Task not found', 404);
  return successResponse(res, { id: req.params.id }, 'Task deleted successfully');
});
