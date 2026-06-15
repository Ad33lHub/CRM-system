import { z } from 'zod';

const DEPARTMENTS = ['engineering', 'design', 'qa', 'management', 'sales', 'hr', 'finance'];
// Roles an admin may provision via the staff wizard (never super_admin or client).
const ASSIGNABLE_ROLES = ['manager', 'developer', 'designer', 'qa_engineer', 'admin'];

// Registering staff provisions a User account + the linked Employee record in one call.
export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(ASSIGNABLE_ROLES),
  department: z.enum(DEPARTMENTS),
  designation: z.string().trim().min(2).max(100),
  joinDate: z.coerce.date(),
  salary: z.coerce.number().nonnegative().max(1e9).default(0),
  salaryCurrency: z.string().trim().max(8).default('PKR'),
  bankDetails: z
    .object({
      bankName: z.string().trim().max(100).optional(),
      accountNumber: z.string().trim().max(50).optional(),
    })
    .optional(),
  skills: z.array(z.string().trim()).default([]),
  emergencyContact: z
    .object({
      name: z.string().trim().max(100).optional(),
      phone: z.string().trim().max(20).optional(),
      relationship: z.string().trim().max(50).optional(),
    })
    .optional(),
});

export const updateEmployeeSchema = z.object({
  department: z.enum(DEPARTMENTS).optional(),
  designation: z.string().trim().min(2).max(100).optional(),
  skills: z.array(z.string().trim()).optional(),
  isActive: z.boolean().optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().max(100).optional(),
      phone: z.string().trim().max(20).optional(),
      relationship: z.string().trim().max(50).optional(),
    })
    .optional(),
});

export const terminateSchema = z.object({
  reason: z.string().trim().min(10).max(500),
  terminatedAt: z.coerce.date().optional(),
});

export const uploadDocumentSchema = z.object({
  type: z.string().trim().min(1).max(100),
});

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  department: z.enum([...DEPARTMENTS, 'all']).default('all'),
});
