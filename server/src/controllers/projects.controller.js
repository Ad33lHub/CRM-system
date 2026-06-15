import Project from '../models/Project.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';

export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  if (req.user && req.user.role === 'client') {
    filter.client = req.user.clientId;
  }
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
  return successResponse(res, doc, 'Project fetched successfully');
});

export const createProject = asyncHandler(async (req, res) => {
  const doc = await Project.create({ ...req.body, createdBy: req.user._id });
  return successResponse(res, doc, 'Project created successfully', 201);
});

export const updateProject = asyncHandler(async (req, res) => {
  const doc = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) return errorResponse(res, 'Project not found', 404);
  return successResponse(res, doc, 'Project updated successfully');
});

export const deleteProject = asyncHandler(async (req, res) => {
  const doc = await Project.findByIdAndDelete(req.params.id);
  if (!doc) return errorResponse(res, 'Project not found', 404);
  return successResponse(res, { id: req.params.id }, 'Project deleted successfully');
});

export const addTeamMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

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

  const before = project.team.length;
  project.team = project.team.filter((m) => String(m.user) !== String(req.params.userId));
  if (project.team.length === before) {
    return errorResponse(res, 'Team member not found', 404);
  }

  await project.save();
  await project.populate('team.user', 'firstName lastName email avatar role');

  return successResponse(res, project, 'Team member removed successfully');
});
