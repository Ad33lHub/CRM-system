import Client from '../models/Client.model.js';
import Project from '../models/Project.model.js';
import Invoice from '../models/Invoice.model.js';
import AuditLog from '../models/AuditLog.model.js';
import User from '../models/User.model.js';
import ClientStatusLog from '../models/ClientStatusLog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  successResponse,
  paginatedResponse,
  notFound,
  errorResponse,
  conflict,
} from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import { createNotification } from '../services/notification.service.js';

/* ── CREATE CLIENT ──────────────────────────────────────────────────── */
export const createClient = asyncHandler(async (req, res) => {
  // Duplicate check
  const existing = await Client.findOne({
    companyName: req.body.companyName,
    isDeleted: false,
  });
  if (existing) {
    return conflict(res, 'A client with this company name already exists');
  }

  const client = await Client.create({
    ...req.body,
    createdBy: req.user._id,
  });

  await client.populate('assignedTo', 'firstName lastName email');

  // Audit log
  await AuditLog.create({
    action: 'client.created',
    entity: 'Client',
    entityId: client._id,
    performedBy: req.user._id,
    after: client.toObject(),
  });

  // Notify assigned user
  if (client.assignedTo) {
    createNotification({
      recipient: client.assignedTo._id || client.assignedTo,
      type: 'client',
      title: 'New Client Assigned',
      message: `${client.companyName} has been assigned to you`,
      link: `/clients/${client._id}`,
    }).catch(() => {});
  }

  return successResponse(res, client, 'Client created successfully', 201);
});

/* ── GET ALL CLIENTS ────────────────────────────────────────────────── */
export const getClients = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    search,
    status,
    industry,
    source,
    tags,
    assignedTo,
    sortBy,
    sortOrder,
    deleted,
  } = req.query;

  const { skip, limit: lim, page: pg } = getPaginationParams({ page, limit });

  // Build filter
  const filter = { isDeleted: deleted === true || deleted === 'true' };

  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { 'contacts.name': { $regex: search, $options: 'i' } },
      { 'contacts.email': { $regex: search, $options: 'i' } },
    ];
  }

  if (status) filter.status = status;
  if (industry) filter.industry = industry;
  if (source) filter.source = source;
  if (assignedTo) {
    if (assignedTo === 'unassigned') {
      filter.assignedTo = null;
    } else {
      filter.assignedTo = assignedTo;
    }
  }
  if (tags) {
    const tagArray = tags.split(',').map((t) => t.trim().toLowerCase());
    filter.tags = { $all: tagArray };
  }

  // Build sort
  const sort = {};
  sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

  const [clients, total] = await Promise.all([
    Client.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(lim)
      .populate('assignedTo', 'firstName lastName avatar')
      .populate('createdBy', 'firstName lastName')
      .select('-notes'),
    Client.countDocuments(filter),
  ]);

  const pagination = buildPaginationMeta(total, pg, lim);
  return paginatedResponse(res, clients, pagination, 'Clients fetched');
});

/* ── GET CLIENT BY ID ───────────────────────────────────────────────── */
export const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findOne({
    _id: req.params.id,
    isDeleted: false,
  })
    .populate('assignedTo', 'firstName lastName email avatar role')
    .populate('createdBy', 'firstName lastName');

  if (!client) return notFound(res, 'Client');

  return successResponse(res, client, 'Client fetched');
});

/* ── UPDATE CLIENT ──────────────────────────────────────────────────── */
export const updateClient = asyncHandler(async (req, res) => {
  const existing = await Client.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!existing) return notFound(res, 'Client');

  // Status Change Logic
  const newStatus = req.body.status;
  if (newStatus !== undefined && newStatus !== existing.status) {
    // 1. Validate transition
    const VALID_TRANSITIONS = {
      lead: ['active', 'churned'],
      active: ['inactive', 'churned'],
      inactive: ['active', 'churned', 'lead'],
      churned: ['lead'],
    };
    if (
      !VALID_TRANSITIONS[existing.status] ||
      !VALID_TRANSITIONS[existing.status].includes(newStatus)
    ) {
      return errorResponse(
        res,
        `Invalid status transition: ${existing.status} → ${newStatus}`,
        400
      );
    }

    // 2. Require reason for status change
    const statusReason = req.body.statusChangeReason;
    if (!statusReason) {
      return errorResponse(res, 'Reason required for status change', 400);
    }

    // 3. Log the transition
    await ClientStatusLog.create({
      client: existing._id,
      fromStatus: existing.status,
      toStatus: newStatus,
      reason: statusReason,
      changedBy: req.user._id,
    });

    // 4. Notify assigned account manager
    if (existing.assignedTo) {
      createNotification({
        recipient: existing.assignedTo,
        type: 'client',
        title: 'Client Status Changed',
        message: `${existing.companyName} changed from ${existing.status} to ${newStatus}`,
        link: `/clients/${existing._id}`,
      }).catch(() => {});
    }

    // 5. Notify all admins (for churned status)
    if (newStatus === 'churned') {
      const churnReason = req.body.churnReason || statusReason;
      const admins = await User.find({
        role: { $in: ['super_admin', 'admin'] },
        isActive: true,
      }).select('_id');
      for (const admin of admins) {
        createNotification({
          recipient: admin._id,
          type: 'client',
          title: '⚠️ Client Churned',
          message: `${existing.companyName} has been marked as churned. Reason: ${churnReason}`,
          link: `/clients/${existing._id}`,
        }).catch(() => {});
      }
    }
  }

  // Field-level diff for audit log
  const changes = [];
  const trackFields = [
    'companyName',
    'status',
    'industry',
    'source',
    'assignedTo',
    'website',
    'companySize',
    'currency',
  ];
  for (const field of trackFields) {
    if (
      req.body[field] !== undefined &&
      String(existing[field] || '') !== String(req.body[field] || '')
    ) {
      changes.push({ field, from: existing[field], to: req.body[field] });
    }
  }

  // Contact merge strategy
  if (req.body.contacts && Array.isArray(req.body.contacts)) {
    const incomingContacts = req.body.contacts;
    const merged = [];

    for (const incoming of incomingContacts) {
      if (incoming._id) {
        const existingContact = existing.contacts.id(incoming._id);
        if (existingContact) {
          Object.assign(existingContact, incoming);
          merged.push(existingContact);
          continue;
        }
      }
      merged.push(incoming);
    }

    // Keep contacts not in the incoming payload (don't auto-delete)
    for (const existingC of existing.contacts) {
      if (!merged.some((m) => m._id && m._id.toString() === existingC._id.toString())) {
        merged.push(existingC);
      }
    }

    req.body.contacts = merged;
  }

  const oldAssignedTo = existing.assignedTo?.toString();

  Object.assign(existing, req.body);
  const updated = await existing.save();

  await updated.populate('assignedTo', 'firstName lastName email avatar');
  await updated.populate('createdBy', 'firstName lastName');

  // Audit log
  if (changes.length > 0) {
    const before = {};
    const after = {};
    changes.forEach((c) => {
      before[c.field] = c.from;
      after[c.field] = c.to;
    });

    await AuditLog.create({
      action: 'client.updated',
      entity: 'Client',
      entityId: updated._id,
      performedBy: req.user._id,
      before,
      after,
      metadata: { changedFields: changes.map((c) => c.field) },
    });
  }

  // Notify new assignee
  const newAssignedTo = updated.assignedTo?._id?.toString() || updated.assignedTo?.toString();
  if (newAssignedTo && newAssignedTo !== oldAssignedTo) {
    createNotification({
      recipient: newAssignedTo,
      type: 'client',
      title: 'Client Assigned to You',
      message: `${updated.companyName} has been assigned to you`,
      link: `/clients/${updated._id}`,
    }).catch(() => {});
  }

  return successResponse(res, updated, 'Client updated successfully');
});

/* ── SOFT DELETE CLIENT ─────────────────────────────────────────────── */
export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!client) return notFound(res, 'Client');

  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    return errorResponse(res, 'Delete reason is required (min 5 characters)', 400);
  }

  // Dependency checks
  const [activeProjects, unpaidInvoices] = await Promise.all([
    Project.countDocuments({ client: req.params.id, status: 'active', isDeleted: false }),
    Invoice.countDocuments({
      client: req.params.id,
      status: { $in: ['sent', 'partially_paid', 'overdue'] },
    }),
  ]);

  if (activeProjects > 0) {
    return conflict(
      res,
      `Cannot delete: client has ${activeProjects} active project(s). Close or reassign first.`
    );
  }
  if (unpaidInvoices > 0) {
    return conflict(
      res,
      `Cannot delete: client has ${unpaidInvoices} unpaid invoice(s). Resolve first.`
    );
  }

  // Soft delete
  client.isDeleted = true;
  client.deletedAt = new Date();
  client.deletedBy = req.user._id;
  client.deleteReason = reason;
  client.restoreDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  client.status = 'inactive';
  await client.save();

  // Audit log
  await AuditLog.create({
    action: 'client.deleted',
    entity: 'Client',
    entityId: client._id,
    performedBy: req.user._id,
    metadata: { reason, restoreDeadline: client.restoreDeadline },
  });

  return successResponse(
    res,
    { restoreDeadline: client.restoreDeadline },
    'Client archived. Can be restored within 30 days.'
  );
});

/* ── RESTORE CLIENT ─────────────────────────────────────────────────── */
export const restoreClient = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, isDeleted: true });
  if (!client) return notFound(res, 'Archived client');

  if (client.restoreDeadline && client.restoreDeadline < Date.now()) {
    return errorResponse(res, 'Restore window expired. Client permanently deleted.', 410);
  }

  client.isDeleted = false;
  client.deletedAt = null;
  client.deletedBy = null;
  client.deleteReason = null;
  client.restoreDeadline = null;
  client.status = 'inactive';
  await client.save();

  await AuditLog.create({
    action: 'client.restored',
    entity: 'Client',
    entityId: client._id,
    performedBy: req.user._id,
  });

  return successResponse(res, client, 'Client restored successfully');
});

/* ── ADD CONTACT ────────────────────────────────────────────────────── */
export const addContact = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
  if (!client) return notFound(res, 'Client');

  if (client.contacts.length >= 20) {
    return errorResponse(res, 'Maximum 20 contacts per client', 400);
  }

  client.contacts.push(req.body);
  await client.save();

  return successResponse(res, client.contacts, 'Contact added');
});

/* ── REMOVE CONTACT ─────────────────────────────────────────────────── */
export const removeContact = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
  if (!client) return notFound(res, 'Client');

  const contact = client.contacts.id(req.params.contactId);
  if (!contact) return notFound(res, 'Contact');

  if (contact.isPrimary && client.contacts.length > 1) {
    return errorResponse(
      res,
      'Cannot remove primary contact. Set another contact as primary first.',
      400
    );
  }

  contact.deleteOne();
  await client.save();

  return successResponse(res, client.contacts, 'Contact removed');
});

/* ── SET PRIMARY CONTACT ────────────────────────────────────────────── */
export const setPrimaryContact = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
  if (!client) return notFound(res, 'Client');

  const contact = client.contacts.id(req.params.contactId);
  if (!contact) return notFound(res, 'Contact');

  client.contacts.forEach((c) => {
    c.isPrimary = false;
  });
  contact.isPrimary = true;
  await client.save();

  return successResponse(res, client.contacts, 'Primary contact updated');
});

/* ── GET STATUS LOG ─────────────────────────────────────────────────── */
export const getStatusLog = asyncHandler(async (req, res) => {
  const logs = await ClientStatusLog.find({
    client: req.params.id,
  })
    .sort({ createdAt: -1 })
    .populate('changedBy', 'firstName lastName avatar');

  return successResponse(res, logs, 'Status logs fetched successfully');
});

/* ── GET TAGS ───────────────────────────────────────────────────────── */
export const getClientTags = asyncHandler(async (req, res) => {
  const tags = await Client.distinct('tags', { isDeleted: false });
  return successResponse(res, tags.sort(), 'Tags fetched');
});

export default {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  restoreClient,
  addContact,
  removeContact,
  setPrimaryContact,
  getClientTags,
  getStatusLog,
};
