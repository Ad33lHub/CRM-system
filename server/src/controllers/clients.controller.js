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
import crypto from 'crypto';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import { createNotification } from '../services/notification.service.js';
import { getManagedTeamUserIds, getManagedClientIds } from '../services/teamScope.service.js';
import { queueEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

/* ── Visibility scope ───────────────────────────────────────────────────
   A manager sees a client when EITHER:
     • the client is assigned (Client.assignedTo) to anyone on their team
       (themselves + direct reports + project teammates), OR
     • the client owns a project the manager runs (owns or sits on the team
       of) — so assigning a manager a project surfaces that project's client.
   Admins see every client; other clients:read roles see only clients
   assigned to themselves. Unassigned clients with no managed project stay
   admin-only.
   ─────────────────────────────────────────────────────────────────────── */
const ADMIN_ROLES = ['super_admin', 'admin'];

// User-id strings whose clients the requester may see (null ⇒ unrestricted).
async function scopeUserIds(user) {
  if (ADMIN_ROLES.includes(user.role)) return null;
  if (user.role === 'manager') return await getManagedTeamUserIds(user);
  return [user._id.toString()];
}

// Mongo filter fragment for the visible clients, or null when unrestricted.
async function clientScopeFilter(user) {
  const ids = await scopeUserIds(user);
  if (!ids) return null;
  const or = [{ assignedTo: { $in: ids } }];
  if (user.role === 'manager') {
    const clientIds = await getManagedClientIds(user);
    if (clientIds.length) or.push({ _id: { $in: clientIds } });
  }
  return { $or: or };
}

// True if the requester may see/act on this (populated or raw) client.
async function canAccessClient(user, client) {
  const ids = await scopeUserIds(user);
  if (!ids) return true;
  const set = new Set(ids.map(String));
  const assigned = client.assignedTo?._id?.toString() || client.assignedTo?.toString();
  if (assigned && set.has(assigned)) return true;
  if (user.role === 'manager') {
    const clientIds = await getManagedClientIds(user);
    const clientId = client._id?.toString() || client.id?.toString();
    return clientIds.includes(clientId);
  }
  return false;
}

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

  // Apply role-based visibility scope (admins unrestricted).
  const scope = await clientScopeFilter(req.user);
  const scopedFilter = scope ? { $and: [filter, scope] } : filter;

  const [clients, total] = await Promise.all([
    Client.find(scopedFilter)
      .sort(sort)
      .skip(skip)
      .limit(lim)
      .populate('assignedTo', 'firstName lastName avatar')
      .populate('createdBy', 'firstName lastName')
      .select('-notes'),
    Client.countDocuments(scopedFilter),
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
  // Hide out-of-scope clients as "not found" rather than leaking existence.
  if (!(await canAccessClient(req.user, client))) return notFound(res, 'Client');

  return successResponse(res, client, 'Client fetched');
});

/* ── UPDATE CLIENT ──────────────────────────────────────────────────── */
export const updateClient = asyncHandler(async (req, res) => {
  const existing = await Client.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!existing) return notFound(res, 'Client');
  if (!(await canAccessClient(req.user, existing))) return notFound(res, 'Client');

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
  if (!(await canAccessClient(req.user, client))) return notFound(res, 'Client');

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
  if (!(await canAccessClient(req.user, client))) return notFound(res, 'Client');

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
  if (!(await canAccessClient(req.user, client))) return notFound(res, 'Client');

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
  // Only return history for clients the requester is allowed to see.
  const client = await Client.findOne({ _id: req.params.id }).select('assignedTo createdBy').lean();
  if (!client) return notFound(res, 'Client');
  if (!(await canAccessClient(req.user, client))) return notFound(res, 'Client');

  const logs = await ClientStatusLog.find({
    client: req.params.id,
  })
    .sort({ createdAt: -1 })
    .populate('changedBy', 'firstName lastName avatar');

  return successResponse(res, logs, 'Status logs fetched successfully');
});

/* ── INVITE CLIENT TO PORTAL ────────────────────────────────────────── */
// A login that meets the User model rules + has upper/lower/digit/special.
function generateTempPassword() {
  return `Pt@${crypto.randomBytes(4).toString('hex')}A1`;
}

function primaryContact(client) {
  const contacts = client.contacts || [];
  return contacts.find((c) => c.isPrimary) || contacts[0] || {};
}

export const inviteClientPortalUser = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
  if (!client) return notFound(res, 'Client');

  const contact = primaryContact(client);
  const email = (req.body.email || contact.email || '').trim().toLowerCase();
  if (!email) {
    return errorResponse(res, 'No contact email available. Add a contact email first.', 400);
  }

  const [firstName, ...rest] = (contact.name || client.companyName || 'Client').split(' ');
  const lastName = rest.join(' ') || 'Portal';
  const tempPassword = generateTempPassword();
  const loginUrl = `${process.env.APP_URL || ''}/login`;

  let user = await User.findOne({ email });
  if (user) {
    // Re-inviting the same client's portal login → reset the password and resend.
    if (user.role !== 'client' || user.clientId?.toString() !== client._id.toString()) {
      return conflict(res, 'A user with this email already exists for a different account');
    }
    user.password = tempPassword; // pre-save hook re-hashes
    await user.save();
  } else {
    user = await User.create({
      firstName,
      lastName,
      email,
      password: tempPassword,
      role: 'client',
      clientId: client._id,
      isEmailVerified: true,
    });
  }

  try {
    await queueEmail({
      to: email,
      subject: `Your ${client.companyName} client portal access`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1b2a4a">
          <h2 style="color:#1b2a4a">Welcome to the ${client.companyName} portal</h2>
          <p>An account has been created so you can review your projects, invoices, and message your project manager.</p>
          <table style="margin:16px 0;font-size:14px">
            <tr><td style="padding:4px 12px 4px 0"><b>Login</b></td><td>${email}</td></tr>
            <tr><td style="padding:4px 12px 4px 0"><b>Temporary password</b></td><td>${tempPassword}</td></tr>
          </table>
          <p><a href="${loginUrl}" style="background:#1b2a4a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open the portal</a></p>
          <p style="color:#888;font-size:12px">Please change your password after your first sign-in.</p>
        </div>`,
    });
  } catch (err) {
    logger.error(`Portal invite email failed for ${email}: ${err.message}`);
  }

  await AuditLog.create({
    action: 'client.portal_invited',
    entity: 'Client',
    entityId: client._id,
    performedBy: req.user._id,
    metadata: { portalUser: user._id, email },
  });

  return successResponse(
    res,
    { email, portalUserId: user._id },
    'Portal invitation sent successfully'
  );
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
  inviteClientPortalUser,
};
