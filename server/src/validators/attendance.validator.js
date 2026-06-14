import { z } from 'zod';

export const clockInSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  location: z
    .object({
      lat: z.coerce.number().min(-90).max(90).optional(),
      lng: z.coerce.number().min(-180).max(180).optional(),
    })
    .optional(),
});

export const clockOutSchema = z.object({
  notes: z.string().trim().max(500).optional(),
});

export const editAttendanceSchema = z.object({
  clockIn: z.coerce.date().optional(),
  clockOut: z.coerce.date().optional(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'remote']).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
  employeeId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID')
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'remote', 'all']).default('all'),
});
