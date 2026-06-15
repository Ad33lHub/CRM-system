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

// Valid stage transitions — quality gate
const STAGE_ORDER = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];

function isValidStageTransition(from, to) {
  // 'lost' is allowed from any stage
  if (to === 'lost') return true;
  const fromIdx = STAGE_ORDER.indexOf(from);
  const toIdx = STAGE_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  // Only allow moving to the next stage (no skipping)
  return toIdx === fromIdx + 1;
}

export const updateLead = asyncHandler(async (req, res) => {
  // Enforce stage quality gate
  if (req.body.stage) {
    const current = await Lead.findById(req.params.id).lean();
    if (!current) return errorResponse(res, 'Lead not found', 404);

    if (req.body.stage !== current.stage && !isValidStageTransition(current.stage, req.body.stage)) {
      const currentIdx = STAGE_ORDER.indexOf(current.stage);
      const nextAllowed = currentIdx < STAGE_ORDER.length - 1
        ? [STAGE_ORDER[currentIdx + 1], 'lost']
        : ['lost'];
      return errorResponse(
        res,
        `Cannot transition from '${current.stage}' to '${req.body.stage}'. Allowed next stages: ${nextAllowed.join(', ')}`,
        400
      );
    }
  }

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
