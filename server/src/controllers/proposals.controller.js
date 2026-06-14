import Proposal from '../models/Proposal.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';

export const getProposals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};

  if (req.user.role === 'client') {
    filter.client = req.user.clientId;
  }

  const [items, total] = await Promise.all([
    Proposal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('client', 'companyName'),
    Proposal.countDocuments(filter),
  ]);

  return paginatedResponse(res, items, page, limit, total, 'Proposals list fetched successfully');
});

export const createProposal = asyncHandler(async (req, res) => {
  const { title, client, description, budget, timeline } = req.body;
  const userId = req.user._id;

  // Mock AI generated sales brief text
  const generatedBrief = `## Proposal for CRM Integration & Deployment
  
### 1. Executive Summary
We propose a complete MERN stack CRM solution tailored for your software house business. This includes signed Cloudinary uploads, a centralized file preview widget, and real-time Socket.IO chat rooms.

### 2. Scope & Timeline
- **Phase 1: Database & API Setup** (Weeks 1-3)
- **Phase 2: File Management Integration** (Weeks 4-6)
- **Phase 3: Realtime Communication & Notifications** (Weeks 7-9)

### 3. Financial Agreement
The estimated cost for the implementation of the CRM workspace is ${budget || 5000} USD, with a target project duration of ${timeline || '3 months'}.`;

  const doc = await Proposal.create({
    title: title || 'MERN Stack CRM Integration Proposal',
    client,
    description: description || '',
    budget: budget || 0,
    timeline: timeline || '3 months',
    generatedBrief,
    createdBy: userId,
  });

  return successResponse(res, doc, 'Proposal generated and saved successfully', 201);
});
