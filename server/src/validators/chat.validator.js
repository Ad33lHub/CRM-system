import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const sendMessageSchema = z.object({
  channelId: OBJECT_ID,
  content: z.string().trim().max(10000).optional(),
  attachments: z.array(z.string().trim().url()).max(10).default([]),
});

export const channelIdParamSchema = z.object({
  channelId: OBJECT_ID,
});
