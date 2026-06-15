import Project from '../models/Project.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';

// Admins see every project; everyone else is scoped to what they're involved in.
const ADMIN_ROLES = ['super_admin', 'admin'];

/**
 * Mongo filter fragment that limits which projects a user may see.
 * Returns `null` for unrestricted (admin) access.
 */
function projectScopeFilter(user) {
  if (!user || ADMIN_ROLES.includes(user.role)) return null;

  // Clients only ever see their own company's projects.
  if (user.role === 'client') {
    return user.clientId ? { client: user.clientId } : { _id: null };
  }

  // Managers see projects they own or sit on the team of.
  if (user.role === 'manager') {
    return { $or: [{ createdBy: user._id }, { 'team.user': user._id }] };
  }

  // Delivery roles (developer/designer/qa_engineer/…) see only assigned projects.
  return { 'team.user': user._id };
}

// True if the (possibly populated) project is visible to the user.
function canViewProject(user, project) {
  if (!user || ADMIN_ROLES.includes(user.role)) return true;
  const uid = user._id.toString();

  if (user.role === 'client') {
    return Boolean(
      project.client && user.clientId && project.client.toString() === user.clientId.toString()
    );
  }

  if (user.role === 'manager' && project.createdBy?.toString() === uid) return true;

  return (project.team || []).some((m) => {
    const memberId = m.user?._id?.toString() || m.user?.toString();
    return memberId === uid;
  });
}

// True if the user may edit/delete the project. Managers manage projects they
// own or sit on; admins manage everything. Clients/delivery roles never can.
function canManageProject(user, project) {
  if (!user || ADMIN_ROLES.includes(user.role)) return true;
  if (user.role !== 'manager') return false;
  const uid = user._id.toString();
  if (project.createdBy?.toString() === uid) return true;
  return (project.team || []).some((m) => {
    const memberId = m.user?._id?.toString() || m.user?.toString();
    return memberId === uid;
  });
}

export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }

  const scope = projectScopeFilter(req.user);
  if (scope) Object.assign(filter, scope);

  const [items, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);
  return paginatedResponse(res, items, page, limit, total, 'Project list fetched successfully');
});

export const getProject = asyncHandler(async (req, res) => {
  const doc = await Project.findById(req.params.id).populate(
    'team.user',
    'firstName lastName email avatar role'
  );
  if (!doc) return errorResponse(res, 'Project not found', 404);

  // Hide projects the user isn't involved in (404 to avoid leaking existence).
  if (!canViewProject(req.user, doc)) {
    return errorResponse(res, 'Project not found', 404);
  }

  return successResponse(res, doc, 'Project fetched successfully');
});

export const createProject = asyncHandler(async (req, res) => {
  const doc = await Project.create({ ...req.body, createdBy: req.user._id });
  return successResponse(res, doc, 'Project created successfully', 201);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

  if (!canManageProject(req.user, project)) {
    return errorResponse(res, 'You can only edit projects you manage', 403);
  }

  const doc = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  return successResponse(res, doc, 'Project updated successfully');
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

  if (!canManageProject(req.user, project)) {
    return errorResponse(res, 'You can only delete projects you manage', 403);
  }

  const doc = await Project.findByIdAndDelete(req.params.id);
  if (!doc) return errorResponse(res, 'Project not found', 404);
  return successResponse(res, { id: req.params.id }, 'Project deleted successfully');
});

export const addTeamMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

  if (!canManageProject(req.user, project)) {
    return errorResponse(res, 'You can only manage the team of projects you manage', 403);
  }

  const alreadyMember = project.team.some((m) => String(m.user) === String(userId));
  if (alreadyMember) {
    return errorResponse(res, 'User is already a team member', 409);
  }

  project.team.push({ user: userId, role });
  await project.save();
  await project.populate('team.user', 'firstName lastName email avatar role');

  return successResponse(res, project, 'Team member added successfully', 201);
});

export const removeTeamMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

  if (!canManageProject(req.user, project)) {
    return errorResponse(res, 'You can only manage the team of projects you manage', 403);
  }

  const before = project.team.length;
  project.team = project.team.filter((m) => String(m.user) !== String(req.params.userId));
  if (project.team.length === before) {
    return errorResponse(res, 'Team member not found', 404);
  }

  await project.save();
  await project.populate('team.user', 'firstName lastName email avatar role');

  return successResponse(res, project, 'Team member removed successfully');
});
