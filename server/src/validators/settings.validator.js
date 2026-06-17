import { z } from 'zod';

const organizationSchema = z
  .object({
    companyName: z.string().trim().min(1, 'Company name is required').max(120),
    address: z.string().trim().max(300),
    supportEmail: z.string().trim().email('Invalid email address').max(160).or(z.literal('')),
    logoUrl: z.string().trim().url('Invalid URL').max(500).or(z.literal('')),
  })
  .partial();

const invoiceDefaultsSchema = z
  .object({
    currency: z.string().trim().min(1).max(8),
    taxRate: z.coerce.number().min(0).max(100),
    invoicePrefix: z.string().trim().max(12),
    paymentTermsDays: z.coerce.number().int().min(0).max(365),
    footerNote: z.string().trim().max(500),
  })
  .partial();

const securitySchema = z
  .object({
    maxLoginAttempts: z.coerce.number().int().min(3).max(20),
    lockoutMinutes: z.coerce.number().int().min(5).max(1440),
    sessionTimeoutMinutes: z.coerce.number().int().min(5).max(1440),
  })
  .partial();

export const updateSettingsSchema = z
  .object({
    organization: organizationSchema,
    invoiceDefaults: invoiceDefaultsSchema,
    security: securitySchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No settings provided to update',
  });

export const broadcastSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(500),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});
