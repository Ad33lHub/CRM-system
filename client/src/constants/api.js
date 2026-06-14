export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = Object.freeze({
  AUTH: '/auth',
  CLIENTS: '/clients',
  LEADS: '/leads',
  PROJECTS: '/projects',
  TASKS: '/tasks',
  INVOICES: '/invoices',
  EMPLOYEES: '/employees',
  NOTIFICATIONS: '/notifications',
  ANALYTICS: '/analytics',
});
