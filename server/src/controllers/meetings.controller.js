import Meeting from '../models/Meeting.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';

export const getMeetings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};

  if (req.query.projectId) {
    filter.projectId = req.query.projectId;
  }

  const [items, total] = await Promise.all([
    Meeting.find(filter).sort({ date: -1 }).skip(skip).limit(limit).populate('projectId', 'name'),
    Meeting.countDocuments(filter),
  ]);

  return paginatedResponse(res, items, page, limit, total, 'Meetings list fetched successfully');
});

export const getMeetingById = asyncHandler(async (req, res) => {
  const doc = await Meeting.findById(req.params.id).populate('projectId', 'name');
  if (!doc) return errorResponse(res, 'Meeting not found', 404);
  return successResponse(res, doc, 'Meeting details fetched successfully');
});

export const createMeeting = asyncHandler(async (req, res) => {
  const { title, projectId, transcript } = req.body;
  const userId = req.user._id;

  // Mock AI summary & action items generator based on transcript
  const summary = `This meeting discussed key project deliverables, timeline alignment, and design approvals. Key milestones were confirmed for the upcoming sprint.`;

  const actionItems = [
    {
      task: 'Complete UI prototype and send for design review',
      assignee: 'Lead Designer',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      task: 'Set up MongoDB collections and seed development data',
      assignee: 'Developer',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  ];

  const doc = await Meeting.create({
    title: title || 'Project Sync Meeting',
    projectId: projectId || null,
    transcript: transcript || 'No transcript provided.',
    summary,
    actionItems,
    createdBy: userId,
  });

  return successResponse(res, doc, 'Meeting created and AI processed successfully', 201);
});
