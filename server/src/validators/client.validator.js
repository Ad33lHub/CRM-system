import { z } from 'zod';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const INDUSTRIES = [
  'technology',
  'finance',
  'healthcare',
  'education',
  'retail',
  'real_estate',
  'manufacturing',
  'media',
  'consulting',
  'other',
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const STATUSES = ['lead', 'active', 'inactive', 'churned'];

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

/* ── Contact Schema ─────────────────────────────────────────────────── */
export const contactZodSchema = z.object({
  _id: z.string().optional(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  designation: z.string().max(100).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).optional().or(z.literal('')),
});

/* ── Address Schema ─────────────────────────────────────────────────── */
export const addressZodSchema = z.object({
  street: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  country: z.string().default('Pakistan'),
  postalCode: z.string().optional().or(z.literal('')),
});

/* ── Create Client Schema ───────────────────────────────────────────── */
export const createClientSchema = z
  .object({
    companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100),
    industry: z.enum(INDUSTRIES, {
      errorMap: () => ({ message: 'Invalid industry value' }),
    }),
    companySize: z.enum(COMPANY_SIZES).optional().nullable(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    contacts: z
      .array(contactZodSchema)
      .min(1, 'At least one contact is required')
      .max(20, 'Maximum 20 contacts allowed')
      .refine((contacts) => contacts.filter((c) => c.isPrimary).length === 1, {
        message: 'Exactly one contact must be marked as primary',
      }),
    billingAddress: addressZodSchema.optional(),
    status: z.enum(STATUSES).default('lead'),
    churnReason: z.string().max(500).optional().or(z.literal('')),
    source: z.enum(SOURCES, {
      errorMap: () => ({ message: 'Invalid source value' }),
    }),
    tags: z.array(z.string().trim().max(30)).max(10, 'Maximum 10 tags').default([]),
    assignedTo: z
      .string()
      .regex(OBJECT_ID_REGEX, 'Invalid user ID')
      .optional()
      .nullable()
      .or(z.literal('')),
    notes: z.string().max(3000).optional().or(z.literal('')),
    currency: z.string().max(3).default('PKR'),
    nextFollowUpAt: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'churned' && (!data.churnReason || data.churnReason.trim() === '')) {
      ctx.addIssue({
        path: ['churnReason'],
        code: z.ZodIssueCode.custom,
        message: 'Churn reason is required when status is churned',
      });
    }
  });

/* ── Update Client Schema ───────────────────────────────────────────── */
export const updateClientSchema = z
  .object({
    companyName: z.string().trim().min(2).max(100).optional(),
    industry: z.enum(INDUSTRIES).optional(),
    companySize: z.enum(COMPANY_SIZES).optional().nullable(),
    website: z.string().url().optional().or(z.literal('')),
    contacts: z.array(contactZodSchema).min(1).max(20).optional(),
    billingAddress: addressZodSchema.optional(),
    status: z.enum(STATUSES).optional(),
    churnReason: z.string().max(500).optional().or(z.literal('')),
    source: z.enum(SOURCES).optional(),
    tags: z.array(z.string().trim().max(30)).max(10).optional(),
    assignedTo: z.string().regex(OBJECT_ID_REGEX).optional().nullable().or(z.literal('')),
    notes: z.string().max(3000).optional().or(z.literal('')),
    currency: z.string().max(3).optional(),
    nextFollowUpAt: z.string().optional().nullable().or(z.literal('')),
    lastContactedAt: z.string().optional().nullable().or(z.literal('')),
    statusChangeReason: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === 'churned' &&
      data.churnReason !== undefined &&
      (!data.churnReason || data.churnReason.trim() === '')
    ) {
      ctx.addIssue({
        path: ['churnReason'],
        code: z.ZodIssueCode.custom,
        message: 'Churn reason is required when status is churned',
      });
    }
  });

/* ── Client Query Schema ────────────────────────────────────────────── */
export const clientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(STATUSES).optional(),
  industry: z.enum(INDUSTRIES).optional(),
  source: z.enum(SOURCES).optional(),
  tags: z.string().optional(),
  assignedTo: z.string().optional(),
  sortBy: z
    .enum(['companyName', 'createdAt', 'totalRevenue', 'lastContactedAt', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  deleted: z.coerce.boolean().default(false),
});

export const createNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(50000, 'Note content must not exceed 50,000 characters'),
  contentText: z.string().max(5000, 'Note text must not exceed 5,000 characters').optional(),
});

export const updateNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(50000, 'Note content must not exceed 50,000 characters'),
  contentText: z.string().max(5000, 'Note text must not exceed 5,000 characters').optional(),
});

export default {
  contactZodSchema,
  addressZodSchema,
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
  createNoteSchema,
  updateNoteSchema,
};
