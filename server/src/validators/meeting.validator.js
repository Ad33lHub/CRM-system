import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createMeetingSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  projectId: OBJECT_ID.optional(),
  transcript: z.string().trim().max(50000).optional(),
  date: z.coerce.date().optional(),
});

export const meetingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  projectId: OBJECT_ID.optional(),
});
