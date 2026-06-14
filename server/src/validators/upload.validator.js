import { z } from 'zod';

export const uploadFileSchema = z.object({
  context: z.enum(['profile', 'document', 'attachment', 'proposal']).default('attachment'),
  entityType: z.string().trim().max(50).optional(),
  entityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid entity ID')
    .optional(),
});

export const deleteFileSchema = z.object({
  publicId: z.string().trim().min(1, 'Public ID is required'),
});
