import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  client: OBJECT_ID,
  manager: OBJECT_ID.optional(),
  team: z.array(OBJECT_ID).default([]),
  status: z.enum(STATUSES).default('planning'),
  budget: z.coerce.number().nonnegative().max(1e9).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  tags: z.array(z.string().trim().max(50)).max(20).default([]),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  manager: OBJECT_ID.optional(),
  status: z.enum(STATUSES).optional(),
  budget: z.coerce.number().nonnegative().max(1e9).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
});

export const teamMemberSchema = z.object({
  userId: OBJECT_ID,
  role: z.string().trim().max(50).optional(),
});

export const milestoneSchema = z.object({
  title: z.string().trim().min(2).max(200),
  dueDate: z.coerce.date(),
  description: z.string().trim().max(1000).optional(),
  isCompleted: z.boolean().default(false),
});

export const statusChangeSchema = z.object({
  status: z.enum(STATUSES),
  reason: z.string().trim().max(500).optional(),
});

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum([...STATUSES, 'all']).default('all'),
  clientId: OBJECT_ID.optional(),
  managerId: OBJECT_ID.optional(),
});
