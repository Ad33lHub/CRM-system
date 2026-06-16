import Task from '../models/Task.model.js';
import Project from '../models/Project.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';
import { createNotification } from '../services/notification.service.js';
import { queueEmail } from '../services/email.service.js';
import { clearEmployeeCache } from '../services/employeeAnalytics.service.js';

/* ── Role groups ────────────────────────────────────────────────────
   No central role constants file exists yet; keep these local until one
   is introduced. (See docs/03_User_Roles.md for the source matrix.)
   ─────────────────────────────────────────────────────────────────── */
const ADMIN_ROLES = ['super_admin', 'admin']; // unrestricted on tasks
const SCOPED_ROLES = ['developer', 'designer', 'qa_engineer']; // own tasks only

const POPULATE_ASSIGNEES = {
  path: 'assignees.user',
  select: 'firstName lastName email avatar role',
};
const POPULATE_CREATOR = { path: 'createdBy', select: 'firstName lastName email avatar' };

/* ── Helpers ────────────────────────────────────────────────────────── */

// Primary assignee user id (the responsible owner), if any.
function primaryAssigneeId(task) {
  const assignees = task?.assignees || [];
  const primary = assignees.find((a) => a.isPrimary) || assignees[0];
  const user = primary?.user;
  return user?._id?.toString() || user?.toString() || null;
}

// Build the assignees array from the single-owner + collaborators API shape.
function buildAssignees({ assignedTo, collaborators = [] }) {
  const list = [];
  if (assignedTo) list.push({ user: assignedTo, isPrimary: true });
  collaborators
    .filter((uid) => uid && uid !== assignedTo)
    .forEach((uid) => list.push({ user: uid, isPrimary: false }));
  return list;
}

// Distinct assignee user-id strings on a task.
function assigneeIds(assignees = []) {
  return [...new Set(assignees.map((a) => a.user?.toString()).filter(Boolean))];
}

// True if the user owns or sits on the team of the given project.
async function userManagesProject(user, projectId) {
  if (ADMIN_ROLES.includes(user.role)) return true;
  if (user.role !== 'manager') return false;
  const project = await Project.findById(projectId).select('createdBy team').lean();
  if (!project) return false;
  const uid = user._id.toString();
  if (project.createdBy?.toString() === uid) return true;
  return (project.team || []).some((t) => t.user?.toString() === uid);
}

// True if the user is an assignee or the creator of the task.
function userOwnsTask(user, task) {
  const uid = user._id.toString();
  if (task.createdBy?.toString() === uid) return true;
  return assigneeIds(task.assignees).includes(uid);
}

// Project ids a manager owns or sits on — the projects whose tasks they may review.
async function managedProjectIds(user) {
  const projects = await Project.find({
    $or: [{ createdBy: user._id }, { 'team.user': user._id }],
  })
    .select('_id')
    .lean();
  return projects.map((p) => p._id);
}

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
      priority: task.priority === 'critical' ? 'urgent' : 'normal',
    });

    if (assigneeEmail) {
      const PRIORITY_COLORS = {
        low: '6B7280',
        medium: 'D97706',
        high: 'DC2626',
        critical: '7C3AED',
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

/* ── Controllers ────────────────────────────────────────────────────── */

export const listTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.priority && req.query.priority !== 'all') filter.priority = req.query.priority;
  if (req.query.projectId) filter.project = req.query.projectId;
  if (req.query.assignedTo) filter['assignees.user'] = req.query.assignedTo;

  // Visibility scope:
  //  • scope=mine → own tasks only (assigned to or created by me) for EVERY role,
  //    backing the "My Tasks" page so even admins/managers see just their own.
  //  • otherwise, role-based visibility (the "all/review" scope):
  //      - admins see everything (no extra filter)
  //      - developer/designer/qa → only their own tasks
  //      - manager → tasks in projects they manage + their own
  if (req.query.scope === 'mine') {
    filter.$or = [{ 'assignees.user': req.user._id }, { createdBy: req.user._id }];
  } else if (SCOPED_ROLES.includes(req.user.role)) {
    filter.$or = [{ 'assignees.user': req.user._id }, { createdBy: req.user._id }];
  } else if (req.user.role === 'manager') {
    const projectIds = await managedProjectIds(req.user);
    filter.$or = [
      { project: { $in: projectIds } },
      { 'assignees.user': req.user._id },
      { createdBy: req.user._id },
    ];
  }

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate(POPULATE_ASSIGNEES)
      .populate(POPULATE_CREATOR)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return paginatedResponse(res, items, page, limit, total, 'Task list fetched successfully');
});

export const getTask = asyncHandler(async (req, res) => {
  const doc = await Task.findById(req.params.id)
    .populate(POPULATE_ASSIGNEES)
    .populate(POPULATE_CREATOR);
  if (!doc) return errorResponse(res, 'Task not found', 404);

  // Scoped roles may only read their own tasks.
  if (SCOPED_ROLES.includes(req.user.role) && !userOwnsTask(req.user, doc)) {
    return errorResponse(res, 'You can only view tasks assigned to you', 403);
  }

  // Managers may read their own tasks or any task inside a project they manage.
  if (req.user.role === 'manager') {
    const allowed =
      userOwnsTask(req.user, doc) || (await userManagesProject(req.user, doc.project));
    if (!allowed) {
      return errorResponse(res, 'You can only view tasks within your own projects', 403);
    }
  }

  return successResponse(res, doc, 'Task fetched successfully');
});

export const createTask = asyncHandler(async (req, res) => {
  const { assignedTo, collaborators, ...rest } = req.body;

  // Managers may only create tasks inside projects they own/are on.
  if (!ADMIN_ROLES.includes(req.user.role)) {
    const allowed = await userManagesProject(req.user, rest.project);
    if (!allowed) {
      return errorResponse(res, 'You can only create tasks within your own projects', 403);
    }
  }

  const assignees = buildAssignees({ assignedTo, collaborators });

  const activityLog = [{ action: 'created', doneBy: req.user._id }];
  if (assignees.length) {
    activityLog.push({
      action: 'assigned',
      to: primaryAssigneeId({ assignees }),
      doneBy: req.user._id,
    });
  }

  const doc = await Task.create({ ...rest, assignees, createdBy: req.user._id, activityLog });

  assigneeIds(assignees).forEach((uid) => triggerTaskAssigned(doc, uid).catch(() => {}));

  const populated = await Task.findById(doc._id)
    .populate(POPULATE_ASSIGNEES)
    .populate(POPULATE_CREATOR);
  return successResponse(res, populated, 'Task created successfully', 201);
});

export const updateTask = asyncHandler(async (req, res) => {
  const previous = await Task.findById(req.params.id).lean();
  if (!previous) return errorResponse(res, 'Task not found', 404);

  const { assignedTo, collaborators, ...rest } = req.body;
  const wantsReassign = assignedTo !== undefined || collaborators !== undefined;

  // ── Access scope ──────────────────────────────────────────────────
  const role = req.user.role;
  if (SCOPED_ROLES.includes(role)) {
    if (!userOwnsTask(req.user, previous)) {
      return errorResponse(res, 'You can only update tasks assigned to you', 403);
    }
    if (wantsReassign) {
      return errorResponse(res, 'Your role cannot reassign tasks to others', 403);
    }
  } else if (!ADMIN_ROLES.includes(role)) {
    // Manager: must own the task's project.
    const allowed = await userManagesProject(req.user, previous.project);
    if (!allowed) {
      return errorResponse(res, 'You can only update tasks within your own projects', 403);
    }
  }

  const update = { ...rest };
  if (wantsReassign) {
    update.assignees = buildAssignees({ assignedTo, collaborators });
  }

  // Stamp completion when moving to done.
  if (update.status && update.status !== previous.status && update.status === 'done') {
    update.completedAt = new Date();
  }

  // ── Activity log entries ──────────────────────────────────────────
  const logEntries = [];
  if (update.status && update.status !== previous.status) {
    logEntries.push({
      action: 'status_changed',
      from: previous.status,
      to: update.status,
      doneBy: req.user._id,
    });
  }
  const prevAssignee = primaryAssigneeId(previous);
  const newAssignee = wantsReassign
    ? primaryAssigneeId({ assignees: update.assignees })
    : prevAssignee;
  if (wantsReassign && newAssignee !== prevAssignee) {
    logEntries.push({
      action: 'reassigned',
      from: prevAssignee || 'unassigned',
      to: newAssignee || 'unassigned',
      doneBy: req.user._id,
    });
  }

  const mutation = { ...update };
  if (logEntries.length) mutation.$push = { activityLog: { $each: logEntries } };

  const doc = await Task.findByIdAndUpdate(req.params.id, mutation, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE_ASSIGNEES)
    .populate(POPULATE_CREATOR);
  if (!doc) return errorResponse(res, 'Task not found', 404);

  if (newAssignee && newAssignee !== prevAssignee) {
    triggerTaskAssigned(doc, newAssignee).catch(() => {});
  }

  if (doc.status === 'done' && previous.status !== 'done') {
    clearEmployeeCache().catch(() => {});
  }

  return successResponse(res, doc, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).lean();
  if (!task) return errorResponse(res, 'Task not found', 404);

  // Managers may only delete tasks inside their own projects.
  if (!ADMIN_ROLES.includes(req.user.role)) {
    const allowed = await userManagesProject(req.user, task.project);
    if (!allowed) {
      return errorResponse(res, 'You can only delete tasks within your own projects', 403);
    }
  }

  await Task.findByIdAndDelete(req.params.id);
  return successResponse(res, { id: req.params.id }, 'Task deleted successfully');
});
