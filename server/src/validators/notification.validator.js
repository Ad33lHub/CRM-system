import { z } from 'zod';

const NOTIFICATION_TYPES = [
  'task',
  'project',
  'invoice',
  'lead',
  'system',
  'mention',
  'reminder',
  'payment',
  'leave',
  'chat',
  'employee',
  'deadline',
  'performance',
];

export const markReadSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification ID'),
});

export const markAllReadSchema = z.object({
  type: z.enum(NOTIFICATION_TYPES).optional(),
});

export const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  isRead: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});
