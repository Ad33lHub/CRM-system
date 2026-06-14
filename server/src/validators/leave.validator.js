import { z } from 'zod';

const LEAVE_TYPES = ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'];

export const createLeaveSchema = z
  .object({
    type: z.enum(LEAVE_TYPES),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().min(10, 'Please provide a reason (min 10 chars)').max(500),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const cancelLeaveSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
