export const MODULES = Object.freeze({
  CLIENTS: 'clients',
  LEADS: 'leads',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  INVOICES: 'invoices',
  EMPLOYEES: 'employees',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  SECURITY: 'security',
});

export const ACTIONS = Object.freeze({
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
});

const ALL = ['create', 'read', 'update', 'delete'];
const RU = ['read', 'update'];
const R = ['read'];
const NONE = [];

export const PERMISSIONS = Object.freeze({
  super_admin: {
    clients: ALL, leads: ALL, projects: ALL, tasks: ALL, invoices: ALL,
    employees: ALL, notifications: ALL, analytics: ALL, security: ALL,
  },
  admin: {
    clients: ALL, leads: ALL, projects: ALL, tasks: ALL,
    invoices: ['create', 'read', 'update'], employees: ['create', 'read', 'update'],
    notifications: ALL, analytics: R, security: R,
  },
  manager: {
    clients: ['create', 'read', 'update'], leads: ['create', 'read', 'update'],
    projects: ['create', 'read', 'update'], tasks: ALL,
    invoices: ['create', 'read', 'update'], employees: R,
    notifications: ['create', 'read'], analytics: R, security: NONE,
  },
  developer: {
    clients: R, leads: NONE, projects: R, tasks: RU, invoices: NONE,
    employees: R, notifications: R, analytics: NONE, security: NONE,
  },
  designer: {
    clients: R, leads: NONE, projects: R, tasks: RU, invoices: NONE,
    employees: R, notifications: R, analytics: NONE, security: NONE,
  },
  qa_engineer: {
    clients: R, leads: NONE, projects: R, tasks: RU, invoices: NONE,
    employees: R, notifications: R, analytics: NONE, security: NONE,
  },
  client: {
    clients: R, leads: NONE, projects: R, tasks: NONE, invoices: R,
    employees: NONE, notifications: R, analytics: R, security: NONE,
  },
});

export const hasPermission = (role, module, action) => {
  const perms = PERMISSIONS[role];
  if (!perms || !perms[module]) return false;
  return perms[module].includes(action);
};
