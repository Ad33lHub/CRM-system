import Lead from '../models/Lead.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';

export const listLeads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Lead.countDocuments(filter),
  ]);
  return paginatedResponse(res, items, page, limit, total, 'Lead list fetched successfully');
});

export const getLead = asyncHandler(async (req, res) => {
  const doc = await Lead.findById(req.params.id);
  if (!doc) return errorResponse(res, 'Lead not found', 404);
  return successResponse(res, doc, 'Lead fetched successfully');
});

export const createLead = asyncHandler(async (req, res) => {
  const doc = await Lead.create(req.body);
  return successResponse(res, doc, 'Lead created successfully', 201);
});

export const updateLead = asyncHandler(async (req, res) => {
  const doc = await Lead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) return errorResponse(res, 'Lead not found', 404);
  return successResponse(res, doc, 'Lead updated successfully');
});

export const deleteLead = asyncHandler(async (req, res) => {
  const doc = await Lead.findByIdAndDelete(req.params.id);
  if (!doc) return errorResponse(res, 'Lead not found', 404);
  return successResponse(res, { id: req.params.id }, 'Lead deleted successfully');
});
