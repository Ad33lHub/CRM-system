import { z } from 'zod';

const OBJECT_ID = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const ROLE_GROUP = z
  .string()
  .trim()
  .regex(/^role:(super_admin|admin|manager|developer|designer|qa_engineer)$/, 'Invalid role group');

const attachmentSchema = z.object({
  name: z.string().trim().optional(),
  url: z.string().trim().url(),
  publicId: z.string().trim().optional(),
  size: z.number().optional(),
});

export const sendMessageSchema = z.object({
  channelId: OBJECT_ID,
  content: z.string().trim().max(10000).optional(),
  attachments: z.array(attachmentSchema).max(10).default([]),
  // 'everyone', a role group like 'role:manager', or a user ObjectId
  recipient: z.union([z.literal('everyone'), ROLE_GROUP, OBJECT_ID]).default('everyone'),
});

export const channelIdParamSchema = z.object({
  channelId: OBJECT_ID,
});

export const messageIdParamSchema = z.object({
  messageId: OBJECT_ID,
});

export const createChannelSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(['general', 'project', 'direct']).default('general'),
  members: z.array(OBJECT_ID).default([]),
});
