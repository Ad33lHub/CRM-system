export const LEAD_STAGES = Object.freeze({
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  WON: 'won',
  LOST: 'lost',
});

export const TASK_STATUS = Object.freeze({
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  TESTING: 'testing',
  DONE: 'done',
  BLOCKED: 'blocked',
});

export const PROJECT_STATUS = Object.freeze({
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const INVOICE_STATUS = Object.freeze({
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  VOID: 'void',
});

export const EMPLOYEE_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
});

export const CLIENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PROSPECT: 'prospect',
});

export const PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

export const asValues = (enumObject) => Object.values(enumObject);
