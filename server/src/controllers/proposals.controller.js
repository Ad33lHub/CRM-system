import Proposal from '../models/Proposal.model.js';
import Client from '../models/Client.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { getPaginationParams } from '../utils/pagination.js';
import { writeProposalBrief } from '../services/ai.service.js';

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

// Deterministic brief used when no AI key is configured (or the API errors).
function fallbackBrief({ title, companyName, description, budget, timeline }) {
  return `## ${title}

### 1. Executive Summary
This proposal outlines our recommended approach to deliver **${title}**${
    companyName ? ` for ${companyName}` : ''
  }. ${
    description
      ? `Based on the requirements provided: ${description}`
      : 'We will tailor the solution to your goals and deliver iteratively.'
  }

### 2. Scope & Deliverables
- Discovery & requirement finalization
- Design, implementation, and integration
- Testing, deployment, and handover

### 3. Timeline
Target duration: **${timeline || 'to be confirmed'}**.

### 4. Investment
Estimated budget: **${budget ? `PKR ${budget}` : 'to be proposed after scoping'}**.`;
}

export const createProposal = asyncHandler(async (req, res) => {
  const { title, client, description, budget, timeline } = req.body;
  const userId = req.user._id;

  const clientDoc = await Client.findById(client).select('companyName').lean();
  const companyName = clientDoc?.companyName;

  const aiBrief = await writeProposalBrief({
    title,
    companyName,
    description,
    budget,
    timeline,
  });
  const generatedBrief =
    aiBrief || fallbackBrief({ title, companyName, description, budget, timeline });

  const doc = await Proposal.create({
    title,
    client,
    description: description || '',
    budget: budget || 0,
    timeline: timeline || '',
    generatedBrief,
    createdBy: userId,
  });

  return successResponse(res, doc, 'Proposal generated and saved successfully', 201);
});
