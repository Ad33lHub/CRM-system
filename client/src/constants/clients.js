// Client status values and allowed transitions.
// Mirrors the server's VALID_TRANSITIONS map in clients.controller.js.

export const CLIENT_STATUS = {
  LEAD: 'lead',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CHURNED: 'churned',
};

export const CLIENT_STATUS_LABELS = {
  lead: 'Lead',
  active: 'Active',
  inactive: 'Inactive',
  churned: 'Churned',
};

export const VALID_STATUS_TRANSITIONS = {
  lead: ['active', 'churned'],
  active: ['inactive', 'churned'],
  inactive: ['active', 'churned', 'lead'],
  churned: ['lead'],
};

export const STATUS_REASON_PLACEHOLDERS = {
  churned: 'Why is this client churning?',
  active: 'What prompted re-activation?',
  inactive: 'Why is this client being deactivated?',
  lead: 'Why re-opening as a lead?',
};
