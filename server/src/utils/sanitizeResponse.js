import AppError, { ERROR_CODES } from './AppError.js';

const SENSITIVE_USER_FIELDS = [
  'password',
  'refreshTokens',
  'loginAttempts',
  'lockUntil',
  'passwordChangedAt',
  'passwordResetToken',
  'passwordResetExpires',
  'emailVerificationOtp',
  'emailVerificationOtpExpires',
];

export function sanitizeUser(userDoc) {
  if (!userDoc) return null;
  const obj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  SENSITIVE_USER_FIELDS.forEach((field) => delete obj[field]);
  return obj;
}

export function sanitizeUsers(userDocs) {
  if (!Array.isArray(userDocs)) return [];
  return userDocs.map(sanitizeUser);
}

function maskAccountNumber(num) {
  if (!num || typeof num !== 'string') return num;
  return num.length > 4 ? `****${num.slice(-4)}` : '****';
}

export function sanitizeEmployee(employeeDoc) {
  if (!employeeDoc) return null;
  const obj =
    typeof employeeDoc.toObject === 'function' ? employeeDoc.toObject() : { ...employeeDoc };

  // Remove raw salary amount — keep currency and type for display
  if (obj.salary) {
    delete obj.salary.amount;
  }

  // Mask bank account number
  if (obj.bankDetails?.accountNumber) {
    obj.bankDetails = {
      ...obj.bankDetails,
      accountNumber: maskAccountNumber(obj.bankDetails.accountNumber),
    };
  }

  return obj;
}

export function sanitizeEmployees(employeeDocs) {
  if (!Array.isArray(employeeDocs)) return [];
  return employeeDocs.map(sanitizeEmployee);
}

const ADMIN_ROLES = ['super_admin', 'admin'];

export function sanitizeAuditLog(logDoc, requestingUserRole) {
  if (!ADMIN_ROLES.includes(requestingUserRole)) {
    throw new AppError('Access to audit logs is restricted to admins', 403, ERROR_CODES.FORBIDDEN);
  }
  if (!logDoc) return null;
  return typeof logDoc.toObject === 'function' ? logDoc.toObject() : { ...logDoc };
}
