import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format (24 hour)

export const assignTeacherSchema = z.object({
  teacherProfileId: z.string().min(1, 'Teacher profile ID is required'),
  classSubjectId: z.string().min(1, 'Class Subject ID is required'),
  academicYearId: z.string().min(1, 'Academic Year ID is required'),
});

export const createTimetableEntrySchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  teacherProfileId: z.string().min(1, 'Teacher profile ID is required'),
  classRoomId: z.string().optional(),
  dayOfWeek: z.number().int().min(1, 'Day must be 1 (Monday) to 7 (Sunday)').max(7),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format (e.g. 09:00)'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format (e.g. 09:45)'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be strictly after start time',
  path: ['endTime'],
});

export const updateTimetableEntrySchema = z.object({
  teacherProfileId: z.string().optional(),
  classRoomId: z.string().optional(),
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
});
