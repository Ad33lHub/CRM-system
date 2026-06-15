import { z } from 'zod';

const TONES = ['professional', 'formal', 'casual', 'persuasive'];

export const emailWriterSchema = z.object({
  recipient: z.string().trim().min(2, 'Recipient/context is required').max(200),
  tone: z.enum(TONES).default('professional'),
  points: z.string().trim().min(3, 'Add the key points to cover').max(3000),
});
