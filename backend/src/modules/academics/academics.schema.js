import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  code: z.string().trim().min(4, 'Code must be at least 4 characters (e.g. 2025-2026)'),
  name: z.string().trim().min(3, 'Name is required (e.g. Academic Year 2025-26)'),
  startDate: z.string().transform((v) => new Date(v)),
  endDate: z.string().transform((v) => new Date(v)),
  isCurrent: z.boolean().default(false),
});

export const updateAcademicYearSchema = z.object({
  name: z.string().trim().min(3).optional(),
  startDate: z.string().transform((v) => new Date(v)).optional(),
  endDate: z.string().transform((v) => new Date(v)).optional(),
  isLocked: z.boolean().optional(),
});

export const createDepartmentSchema = z.object({
  campusId: z.string().optional(),
  code: z.string().trim().min(2).max(20).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().optional(),
  campusId: z.string().optional(),
});

export const createCourseSchema = z.object({
  departmentId: z.string().optional(),
  code: z.string().trim().min(2).max(20).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2), // e.g. "Grade 10" or "B.Sc Computer Science"
  description: z.string().optional(),
  durationYears: z.number().int().min(1).default(1),
});

export const updateCourseSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().optional(),
  durationYears: z.number().int().min(1).optional(),
  departmentId: z.string().optional(),
});

export const createSectionSchema = z.object({
  courseId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic Year ID is required'),
  name: z.string().trim().min(1), // e.g. "Section A"
  capacity: z.number().int().min(1).default(40),
});

export const updateSectionSchema = z.object({
  name: z.string().trim().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  courseId: z.string().optional(),
});

export const createSubjectSchema = z.object({
  departmentId: z.string().optional(),
  code: z.string().trim().min(2).max(20).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2),
  creditHours: z.number().optional(),
  isElective: z.boolean().default(false),
});

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(2).optional(),
  creditHours: z.number().optional(),
  isElective: z.boolean().optional(),
  departmentId: z.string().optional(),
});

export const linkClassSubjectSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
});
