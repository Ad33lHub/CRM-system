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
  const doc = await Project.findById(req.params.id);
  if (!doc) return errorResponse(res, 'Project not found', 404);
  return successResponse(res, doc, 'Project fetched successfully');
});

export const createProject = asyncHandler(async (req, res) => {
  const doc = await Project.create(req.body);
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
