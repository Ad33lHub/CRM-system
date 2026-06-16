import { z } from 'zod';

const OBJECT_ID = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const sendMessageSchema = z.object({
  projectId: OBJECT_ID,
  body: z.string().trim().min(1, 'Message cannot be empty').max(4000),
});

export const threadQuerySchema = z.object({
  projectId: OBJECT_ID,
});
