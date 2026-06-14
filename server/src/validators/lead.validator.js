import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const SOURCES = [
  'referral',
  'linkedin',
  'website',
  'cold_outreach',
  'upwork',
  'fiverr',
  'google_ads',
  'event',
  'other',
];

export const createLeadSchema = z.object({
  title: z.string().trim().min(2).max(200),
  company: z.string().trim().max(100).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  phone: z.string().trim().max(20).optional(),
  source: z.enum(SOURCES).optional(),
  stage: z.enum(STAGES).default('new'),
  estimatedValue: z.coerce.number().nonnegative().max(1e9).optional(),
  assignedTo: OBJECT_ID.optional(),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().max(50)).max(10).default([]),
});

export const updateLeadSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  company: z.string().trim().max(100).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  phone: z.string().trim().max(20).optional(),
  source: z.enum(SOURCES).optional(),
  stage: z.enum(STAGES).optional(),
  estimatedValue: z.coerce.number().nonnegative().max(1e9).optional(),
  assignedTo: OBJECT_ID.optional(),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().max(50)).max(10).optional(),
});

export const stageChangeSchema = z.object({
  stage: z.enum(STAGES),
  reason: z.string().trim().max(500).optional(),
});

export const addActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
  summary: z.string().trim().min(5).max(1000),
  date: z.coerce.date().optional(),
  nextFollowUp: z.coerce.date().optional(),
});

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  stage: z.enum([...STAGES, 'all']).default('all'),
  source: z.enum([...SOURCES, 'all']).default('all'),
  assignedTo: OBJECT_ID.optional(),
  search: z.string().trim().max(100).optional(),
});

export const filterPresetSchema = z.object({
  name: z.string().trim().min(2).max(100),
  filters: z.record(z.string(), z.unknown()),
});
