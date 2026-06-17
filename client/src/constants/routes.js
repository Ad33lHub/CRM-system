export const ROUTES = {
  // Public
  LOGIN:              '/login',
  REGISTER:           '/register',
  FORGOT_PASSWORD:    '/forgot-password',
  RESET_PASSWORD:     '/reset-password/:token',

  // Dashboard
  DASHBOARD:          '/dashboard',

  // Clients
  CLIENTS:            '/clients',
  CLIENT_CREATE:      '/clients/new',
  CLIENT_DETAIL:      '/clients/:id',
  CLIENT_EDIT:        '/clients/:id/edit',

  // Leads
  LEADS:              '/leads',
  LEAD_CREATE:        '/leads/new',
  LEAD_DETAIL:        '/leads/:id',

  // Projects
  PROJECTS:           '/projects',
  PROJECT_CREATE:     '/projects/new',
  PROJECT_DETAIL:     '/projects/:id',
  PROJECT_EDIT:       '/projects/:id/edit',

  // Tasks
  TASKS:              '/tasks',
  TASK_DETAIL:        '/tasks/:id',

  // Invoices
  INVOICES:           '/invoices',
  INVOICE_CREATE:     '/invoices/new',
  INVOICE_DETAIL:     '/invoices/:id',

  // Employees
  EMPLOYEES:          '/employees',
  EMPLOYEE_CREATE:    '/employees/new',
  EMPLOYEE_DETAIL:    '/employees/:id',

  // Settings
  SETTINGS:           '/settings',
  PROFILE:            '/profile',
  PROFILE_SETTINGS:   '/settings/profile',

  // Chat
  CHAT:               '/chat',

  // Team & Attendance
  TEAM:               '/team',
  ATTENDANCE:         '/attendance',

  // Meetings
  MEETING_CREATE:     '/meetings/new',
  MEETING_DETAIL:     '/meetings/:id',

  // Proposals
  PROPOSAL_CREATE:    '/proposals',

  // AI Tools
  EMAIL_WRITER:       '/tools/email-writer',

  // Reports
  REPORTS:            '/reports',

  // Admin
  ACTIVITY_DASHBOARD: '/admin/activity',

  // Errors
  NOT_FOUND:          '/404',
  FORBIDDEN:          '/403',

  // Dev only
  STYLE_GUIDE:        '/style-guide',
};

// Helper: build route with params
// Usage: buildRoute(ROUTES.CLIENT_DETAIL, { id: '123' }) → '/clients/123'
export const buildRoute = (route, params = {}) => {
  return Object.entries(params).reduce(
    (path, [key, val]) => path.replace(`:${key}`, val),
    route
  );
};
