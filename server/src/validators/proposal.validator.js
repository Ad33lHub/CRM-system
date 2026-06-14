import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createProposalSchema = z.object({
  title: z.string().trim().min(2).max(300),
  client: OBJECT_ID,
  description: z.string().trim().max(5000).optional(),
  budget: z.coerce.number().nonnegative().max(1e9).optional(),
  timeline: z.string().trim().max(500).optional(),
});

export const proposalQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
