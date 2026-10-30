import { z } from 'zod';

export const createSubstitutionSchema = z.object({
  timetableEntryId: z.string().min(1, 'Timetable entry ID is required'),
  substituteTeacherId: z.string().min(1, 'Substitute teacher ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  remarks: z.string().optional(),
});

export const cancelSubstitutionSchema = z.object({
  remarks: z.string().optional(),
});
