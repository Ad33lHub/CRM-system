import Lead from '../models/Lead.model.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * GET /leads/members
 * Fetch assignable team members based on role permissions
 */
export const getAssignableMembers = asyncHandler(async (req, res) => {
  const role = req.user.role;

  if (role === 'super_admin' || role === 'admin') {
    const users = await User.find({
      role: { $in: ['super_admin', 'admin', 'manager', 'developer', 'designer', 'qa_engineer'] },
      isActive: true,
    })
      .select('firstName lastName email role avatar')
      .sort({ firstName: 1 });
    return successResponse(res, users, 'Visible members fetched');
  }

  if (role === 'manager') {
    const users = await User.find({
      $or: [
        { _id: req.user._id },
        { role: { $in: ['developer', 'designer', 'qa_engineer'] } },
      ],
      isActive: true,
    })
      .select('firstName lastName email role avatar')
      .sort({ firstName: 1 });
    return successResponse(res, users, 'Team members fetched');
  }

  // Sales rep / standard user
  const me = await User.findById(req.user._id)
    .select('firstName lastName email role avatar')
    .lean();
  return successResponse(res, [me], 'Self member fetched');
});

/**
 * GET /leads/export
 * Export full leads pipeline to CSV (Admin only)
 */
export const exportLeads = asyncHandler(async (req, res) => {
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return errorResponse(res, 'Access denied. Admins only.', 403);
  }

  const leads = await Lead.find({ isDeleted: { $ne: true } })
    .populate('assignedTo', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    'ID',
    'Full Name',
    'Company',
    'Email',
    'Phone',
    'Source',
    'Stage',
    'Value',
    'Assigned To',
    'Priority',
    'Notes',
    'Expected Close Date',
    'Created At',
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map((l) => [
    l._id.toString(),
    l.fullName,
    l.company || '',
    l.email,
    l.phone || '',
    l.source,
    l.stage,
    l.value,
    l.assignedTo
      ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}`
      : 'Unassigned',
    l.priority,
    l.notes || '',
    l.expectedCloseDate
      ? new Date(l.expectedCloseDate).toISOString().split('T')[0]
      : '',
    l.createdAt ? new Date(l.createdAt).toISOString() : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map(escapeCSV).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"');
  return res.status(200).send(csvContent);
});

/**
 * GET /leads
 * List leads based on user role access
 */
export const listLeads = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const filter = { isDeleted: { $ne: true } };

  // 1. Role-based scoping
  if (role === 'super_admin' || role === 'admin') {
    if (req.query.assignedTo && req.query.assignedTo !== 'all') {
      filter.assignedTo = req.query.assignedTo;
    }
  } else if (role === 'manager') {
    const teamUsers = await User.find({
      role: { $in: ['developer', 'designer', 'qa_engineer'] },
    }).select('_id').lean();
    const teamIds = teamUsers.map((u) => u._id);
    const allowedAssignees = [req.user._id, ...teamIds];

    if (req.query.assignedTo && req.query.assignedTo !== 'all') {
      if (allowedAssignees.map(String).includes(String(req.query.assignedTo))) {
        filter.assignedTo = req.query.assignedTo;
      } else {
        // Force manager team scoping
        filter.assignedTo = { $in: [...allowedAssignees, null] };
      }
    } else {
      filter.assignedTo = { $in: [...allowedAssignees, null] };
    }
  } else {
    // Sales Rep / Standard user
    filter.assignedTo = req.user._id;
  }

  // 2. Toolbar filters
  if (req.query.stage && req.query.stage !== 'all') {
    filter.stage = req.query.stage;
  }
  if (req.query.source && req.query.source !== 'all') {
    filter.source = req.query.source;
  }
  if (req.query.priority && req.query.priority !== 'all') {
    filter.priority = req.query.priority;
  }
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { fullName: searchRegex },
      { company: searchRegex },
      { email: searchRegex },
    ];
  }
  if (req.query.dateFrom || req.query.dateTo) {
    filter.expectedCloseDate = {};
    if (req.query.dateFrom) {
      filter.expectedCloseDate.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filter.expectedCloseDate.$lte = new Date(req.query.dateTo);
    }
  }

  // We load all matching leads for the pipeline metrics and board
  const items = await Lead.find(filter)
    .populate('assignedTo', 'firstName lastName email avatar role')
    .sort({ createdAt: -1 });

  return successResponse(res, items, 'Leads fetched successfully');
});

/**
 * GET /leads/:id
 * Retrieve a specific lead
 */
export const getLead = asyncHandler(async (req, res) => {
  const doc = await Lead.findById(req.params.id)
    .populate('assignedTo', 'firstName lastName email avatar role')
    .populate('activities.doneBy', 'firstName lastName role avatar');

  if (!doc) return errorResponse(res, 'Lead not found', 404);

  const role = req.user.role;

  // Access check
  if (role === 'super_admin' || role === 'admin') {
    // Allowed
  } else if (role === 'manager') {
    if (doc.assignedTo) {
      const isSelf = doc.assignedTo._id.toString() === req.user._id.toString();
      const isTeam = ['developer', 'designer', 'qa_engineer'].includes(doc.assignedTo.role);
      if (!isSelf && !isTeam) {
        return errorResponse(res, 'Access denied. Lead assigned to another team/manager.', 403);
      }
    }
  } else {
    // Sales rep USER
    if (!doc.assignedTo || doc.assignedTo._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied. You can only view your own leads.', 403);
    }
  }

  return successResponse(res, doc, 'Lead fetched successfully');
});

/**
 * POST /leads
 * Create a new lead
 */
export const createLead = asyncHandler(async (req, res) => {
  const role = req.user.role;

  // 1. Email uniqueness check among active leads
  const existingEmail = await Lead.findOne({
    email: req.body.email.toLowerCase(),
    isDeleted: { $ne: true },
  });
  if (existingEmail) {
    return errorResponse(res, 'A lead with this email address already exists in the pipeline.', 400);
  }

  // 2. Access constraints on assignee assignment
  if (role === 'super_admin' || role === 'admin') {
    // Allowed to assign anyone
  } else if (role === 'manager') {
    if (req.body.assignedTo) {
      const isSelf = req.body.assignedTo === req.user._id.toString();
      const targetUser = await User.findById(req.body.assignedTo).lean();
      const isTeam = targetUser && ['developer', 'designer', 'qa_engineer'].includes(targetUser.role);
      if (!isSelf && !isTeam) {
        return errorResponse(res, 'Managers can only assign leads to themselves or team members.', 403);
      }
    }
  } else {
    // Sales rep: can only assign to themselves
    req.body.assignedTo = req.user._id;
  }

  // Create document
  const payload = {
    ...req.body,
    createdBy: req.user._id,
    activities: [
      {
        type: 'comment',
        note: 'Lead created in pipeline',
        doneBy: req.user._id,
        date: new Date(),
      },
    ],
  };

  const doc = await Lead.create(payload);
  const populated = await Lead.findById(doc._id).populate('assignedTo', 'firstName lastName email avatar role');

  return successResponse(res, populated, 'Lead created successfully', 201);
});

/**
 * PATCH /leads/:id
 * Update a lead
 */
export const updateLead = asyncHandler(async (req, res) => {
  const existing = await Lead.findById(req.params.id);
  if (!existing) return errorResponse(res, 'Lead not found', 404);

  const role = req.user.role;

  // 1. Ownership & updates access verification
  if (role === 'super_admin' || role === 'admin') {
    // Allowed
  } else if (role === 'manager') {
    if (existing.assignedTo) {
      const isSelf = existing.assignedTo.toString() === req.user._id.toString();
      const targetUser = await User.findById(existing.assignedTo).lean();
      const isTeam = targetUser && ['developer', 'designer', 'qa_engineer'].includes(targetUser.role);
      if (!isSelf && !isTeam) {
        return errorResponse(res, 'Access denied. Lead belongs to another manager/team.', 403);
      }
    }
    // Reassignment target verification
    if (req.body.assignedTo) {
      const isSelf = req.body.assignedTo === req.user._id.toString();
      const targetUser = await User.findById(req.body.assignedTo).lean();
      const isTeam = targetUser && ['developer', 'designer', 'qa_engineer'].includes(targetUser.role);
      if (!isSelf && !isTeam) {
        return errorResponse(res, 'Managers can only reassign leads to themselves or team members.', 403);
      }
    }
  } else {
    // Sales rep: can only update if assigned to them, and cannot reassign
    if (!existing.assignedTo || existing.assignedTo.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied. You can only edit leads assigned to yourself.', 403);
    }
    if (req.body.assignedTo && req.body.assignedTo !== req.user._id.toString()) {
      return errorResponse(res, 'Sales reps cannot reassign leads to other users.', 403);
    }
  }

  // 2. Email uniqueness check
  if (req.body.email && req.body.email.toLowerCase() !== existing.email.toLowerCase()) {
    const duplicate = await Lead.findOne({
      email: req.body.email.toLowerCase(),
      isDeleted: { $ne: true },
      _id: { $ne: existing._id },
    });
    if (duplicate) {
      return errorResponse(res, 'A lead with this email address already exists in the pipeline.', 400);
    }
  }

  // 3. Stage Quality Gate: New leads cannot transition to Won or Lost directly
  if (req.body.stage && req.body.stage !== existing.stage) {
    if (existing.stage === 'New' && (req.body.stage === 'Won' || req.body.stage === 'Lost')) {
      return errorResponse(res, 'Qualify this lead before marking as won or lost', 400);
    }
  }

  // 4. Construct activities log
  const activities = [...(existing.activities || [])];
  let detailsChanged = false;

  if (req.body.stage && req.body.stage !== existing.stage) {
    activities.push({
      type: 'stage_change',
      note: `Moved stage from ${existing.stage} to ${req.body.stage}`,
      doneBy: req.user._id,
      date: new Date(),
    });
  }

  // Check specific fields changes for generic edit log
  for (const key of ['fullName', 'company', 'email', 'phone', 'value', 'priority', 'expectedCloseDate']) {
    if (req.body[key] !== undefined && String(req.body[key]) !== String(existing[key] || '')) {
      detailsChanged = true;
    }
  }

  if (req.body.notes !== undefined && req.body.notes !== existing.notes) {
    activities.push({
      type: 'comment',
      note: 'Notes updated',
      doneBy: req.user._id,
      date: new Date(),
    });
  } else if (detailsChanged) {
    activities.push({
      type: 'edit',
      note: 'Lead details updated',
      doneBy: req.user._id,
      date: new Date(),
    });
  }

  req.body.activities = activities;

  const doc = await Lead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('assignedTo', 'firstName lastName email avatar role')
    .populate('activities.doneBy', 'firstName lastName role avatar');

  return successResponse(res, doc, 'Lead updated successfully');
});

/**
 * DELETE /leads/:id
 * Delete a lead
 */
export const deleteLead = asyncHandler(async (req, res) => {
  const existing = await Lead.findById(req.params.id);
  if (!existing) return errorResponse(res, 'Lead not found', 404);

  const role = req.user.role;

  // 1. RBAC constraints on deletion
  if (role === 'super_admin' || role === 'admin') {
    // Allowed
  } else if (role === 'manager') {
    // Managers can only delete leads assigned to their team
    if (existing.assignedTo) {
      const isSelf = existing.assignedTo.toString() === req.user._id.toString();
      const targetUser = await User.findById(existing.assignedTo).lean();
      const isTeam = targetUser && ['developer', 'designer', 'qa_engineer'].includes(targetUser.role);
      if (!isSelf && !isTeam) {
        return errorResponse(res, 'Access denied. You cannot delete leads from other teams.', 403);
      }
    }
    // Managers cannot delete Won or Lost leads
    if (existing.stage === 'Won' || existing.stage === 'Lost') {
      return errorResponse(res, 'Managers cannot delete Won or Lost leads.', 403);
    }
  } else {
    // Sales reps cannot delete leads
    return errorResponse(res, 'Access denied. Sales reps cannot delete leads.', 403);
  }

  await Lead.findByIdAndDelete(req.params.id);
  return successResponse(res, { id: req.params.id }, 'Lead deleted successfully');
});
