import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
// Must match the Task model enums exactly.
const STATUSES = ['todo', 'in_progress', 'review', 'testing', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  project: OBJECT_ID,
  assignedTo: OBJECT_ID.optional(),
  status: z.enum(STATUSES).default('todo'),
  priority: z.enum(PRIORITIES).default('medium'),
  estimatedHours: z.coerce.number().nonnegative().max(1000).optional(),
  dueDate: z.coerce.date().optional(),
  tags: z.array(z.string().trim().max(50)).max(10).default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  assignedTo: OBJECT_ID.optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  estimatedHours: z.coerce.number().nonnegative().max(1000).optional(),
  dueDate: z.coerce.date().optional(),
  tags: z.array(z.string().trim().max(50)).max(10).optional(),
});

export const addTimeLogSchema = z.object({
  hours: z.coerce.number().positive().max(24),
  date: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateChecklistSchema = z.object({
  items: z.array(
    z.object({
      text: z.string().trim().min(1).max(200),
      isCompleted: z.boolean().default(false),
    })
  ),
});

export const statusChangeSchema = z.object({
  status: z.enum(STATUSES),
  reason: z.string().trim().max(500).optional(),
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum([...STATUSES, 'all']).default('all'),
  priority: z.enum([...PRIORITIES, 'all']).default('all'),
  projectId: OBJECT_ID.optional(),
  assignedTo: OBJECT_ID.optional(),
});
