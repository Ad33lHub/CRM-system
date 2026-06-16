import PortalMessage from '../models/PortalMessage.model.js';
import Project from '../models/Project.model.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { createNotification } from '../services/notification.service.js';

const ADMIN_ROLES = ['super_admin', 'admin'];
const POPULATE_SENDER = { path: 'sender', select: 'firstName lastName avatar role' };

// Managers who run a project: its creator + any team member with the manager role.
async function projectManagerIds(project) {
  const teamUserIds = (project.team || []).map((t) => t.user).filter(Boolean);
  const managerTeam = await User.find({ _id: { $in: teamUserIds }, role: 'manager' })
    .select('_id')
    .lean();
  const ids = new Set(managerTeam.map((u) => u._id.toString()));
  if (project.createdBy) ids.add(project.createdBy.toString());
  return [...ids];
}

// Resolve a project the requester is allowed to message about, or null.
async function resolveAccessibleProject(user, projectId) {
  const project = await Project.findById(projectId).select('client createdBy team').lean();
  if (!project) return { error: 'Project not found', code: 404 };

  if (user.role === 'client') {
    if (!user.clientId || project.client?.toString() !== user.clientId.toString()) {
      return { error: 'Project not found', code: 404 };
    }
    return { project };
  }
  if (ADMIN_ROLES.includes(user.role)) return { project };
  if (user.role === 'manager') {
    const uid = user._id.toString();
    const onTeam =
      project.createdBy?.toString() === uid ||
      (project.team || []).some((t) => t.user?.toString() === uid);
    if (onTeam) return { project };
  }
  return { error: 'You cannot access this project thread', code: 403 };
}

/** GET /portal/messages?projectId= — full thread for one project. */
export const listMessages = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return errorResponse(res, 'projectId is required', 400);

  const { project, error, code } = await resolveAccessibleProject(req.user, projectId);
  if (error) return errorResponse(res, error, code);

  const messages = await PortalMessage.find({ project: project._id })
    .sort({ createdAt: 1 })
    .populate(POPULATE_SENDER);

  // Mark the other side's messages as read for this viewer.
  const isClient = req.user.role === 'client';
  await PortalMessage.updateMany(
    { project: project._id, fromClient: !isClient },
    { $set: isClient ? { readByClient: true } : { readByStaff: true } }
  );

  return successResponse(res, messages, 'Messages fetched successfully');
});

/** POST /portal/messages — { projectId, body } */
export const sendMessage = asyncHandler(async (req, res) => {
  const { projectId, body } = req.body;

  const { project, error, code } = await resolveAccessibleProject(req.user, projectId);
  if (error) return errorResponse(res, error, code);

  const fromClient = req.user.role === 'client';
  const message = await PortalMessage.create({
    client: project.client,
    project: project._id,
    sender: req.user._id,
    fromClient,
    body,
    readByClient: fromClient,
    readByStaff: !fromClient,
  });

  // Notify the counterpart side.
  try {
    if (fromClient) {
      const managerIds = await projectManagerIds(project);
      await Promise.all(
        managerIds.map((rid) =>
          createNotification({
            recipient: rid,
            type: 'chat',
            title: 'New client message',
            message: body.slice(0, 120),
            link: `/client-messages?projectId=${project._id}`,
          })
        )
      );
    } else {
      const portalUsers = await User.find({ clientId: project.client, role: 'client' })
        .select('_id')
        .lean();
      await Promise.all(
        portalUsers.map((u) =>
          createNotification({
            recipient: u._id,
            type: 'chat',
            title: 'Reply from your project team',
            message: body.slice(0, 120),
            link: `/portal/messages?projectId=${project._id}`,
          })
        )
      );
    }
  } catch {
    // Notifications are best-effort.
  }

  const populated = await PortalMessage.findById(message._id).populate(POPULATE_SENDER);
  return successResponse(res, populated, 'Message sent successfully', 201);
});

/**
 * GET /portal/threads — one row per project that has a conversation, with the
 * last message + the viewer's unread count. Drives the client message centre
 * and the staff "Client Messages" inbox.
 */
export const listThreads = asyncHandler(async (req, res) => {
  const isClient = req.user.role === 'client';

  // Which projects can this viewer see?
  let projectFilter;
  if (isClient) {
    if (!req.user.clientId) return successResponse(res, [], 'No threads');
    projectFilter = { client: req.user.clientId };
  } else if (ADMIN_ROLES.includes(req.user.role)) {
    projectFilter = {};
  } else {
    projectFilter = { $or: [{ createdBy: req.user._id }, { 'team.user': req.user._id }] };
  }

  const projects = await Project.find(projectFilter)
    .select('name client status')
    .populate('client', 'companyName')
    .lean();
  const projectIds = projects.map((p) => p._id);

  const messages = await PortalMessage.find({ project: { $in: projectIds } })
    .sort({ createdAt: -1 })
    .lean();

  const byProject = new Map();
  messages.forEach((m) => {
    const key = m.project.toString();
    if (!byProject.has(key)) byProject.set(key, { last: m, unread: 0 });
    const entry = byProject.get(key);
    const unreadForViewer = isClient
      ? !m.readByClient && !m.fromClient
      : !m.readByStaff && m.fromClient;
    if (unreadForViewer) entry.unread += 1;
  });

  const threads = projects
    .filter((p) => byProject.has(p._id.toString()))
    .map((p) => {
      const entry = byProject.get(p._id.toString());
      return {
        project: { _id: p._id, name: p.name, status: p.status },
        client: p.client,
        lastMessage: {
          body: entry.last.body,
          createdAt: entry.last.createdAt,
          fromClient: entry.last.fromClient,
        },
        unread: entry.unread,
      };
    })
    .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

  return successResponse(res, threads, 'Threads fetched successfully');
});

export default { listMessages, sendMessage, listThreads };
