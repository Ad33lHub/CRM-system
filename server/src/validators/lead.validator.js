import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const SOURCES = ['Manual', 'Website', 'Referral', 'Social', 'Other'];
const STAGES = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  company: z.string().trim().max(100).optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email format').toLowerCase(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  source: z.enum(SOURCES).default('Manual'),
  stage: z.enum(STAGES).default('New'),
  value: z.coerce.number().nonnegative('Value must be a positive number').default(0),
  assignedTo: OBJECT_ID.nullable().optional(),
  priority: z.enum(PRIORITIES).default('Medium'),
  notes: z.string().trim().max(500, 'Notes must be under 500 characters').optional().or(z.literal('')),
  expectedCloseDate: z.preprocess((val) => {
    if (!val || val === '') return null;
    return new Date(val);
  }, z.date().nullable().optional()),
});

export const updateLeadSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  company: z.string().trim().max(100).optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email format').toLowerCase().optional(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  source: z.enum(SOURCES).optional(),
  stage: z.enum(STAGES).optional(),
  value: z.coerce.number().nonnegative('Value must be a positive number').optional(),
  assignedTo: OBJECT_ID.nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
  notes: z.string().trim().max(500, 'Notes must be under 500 characters').optional().or(z.literal('')),
  expectedCloseDate: z.preprocess((val) => {
    if (!val || val === '') return null;
    return new Date(val);
  }, z.date().nullable().optional()),
});

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
  stage: z.enum([...STAGES, 'all']).default('all'),
  source: z.enum([...SOURCES, 'all']).default('all'),
  priority: z.enum([...PRIORITIES, 'all']).default('all'),
  assignedTo: z.string().trim().optional(),
  search: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
});
