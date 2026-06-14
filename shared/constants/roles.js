export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  DESIGNER: 'designer',
  QA_ENGINEER: 'qa_engineer',
  CLIENT: 'client',
});

export const ROLE_LABELS = Object.freeze({
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  developer: 'Developer',
  designer: 'Designer',
  qa_engineer: 'QA Engineer',
  client: 'Client',
});

export const ROLE_HIERARCHY = Object.freeze({
  super_admin: 0,
  admin: 1,
  manager: 2,
  developer: 3,
  designer: 3,
  qa_engineer: 3,
  client: 99,
});

export const INTERNAL_ROLES = Object.freeze([
  'super_admin', 'admin', 'manager', 'developer', 'designer', 'qa_engineer',
]);
