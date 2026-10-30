import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().trim().min(3, 'Notice title is required'),
  content: z.string().trim().min(5, 'Notice content is required'),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS', 'STAFF']).default('ALL'),
  isUrgent: z.boolean().default(false),
  expiresAt: z.string().optional().nullable(),
});
