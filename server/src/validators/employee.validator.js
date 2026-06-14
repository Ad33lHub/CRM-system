import { z } from 'zod';

const DEPARTMENTS = ['engineering', 'design', 'qa', 'management', 'sales', 'hr', 'finance'];

export const createEmployeeSchema = z.object({
  user: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  department: z.enum(DEPARTMENTS),
  designation: z.string().trim().min(2).max(100),
  joinDate: z.coerce.date(),
  skills: z.array(z.string().trim()).default([]),
  emergencyContact: z
    .object({
      name: z.string().trim().max(100).optional(),
      phone: z.string().trim().max(20).optional(),
      relationship: z.string().trim().max(50).optional(),
    })
    .optional(),
  createdBy: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')
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
