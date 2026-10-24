import { z } from 'zod';

export const createExamSchema = z.object({
  academicYearId: z.string().min(1, 'Academic Year ID is required'),
  name: z.string().trim().min(3, 'Exam name is required (e.g. Midterm Examination 2025)'),
  examType: z.enum(['UNIT_TEST', 'MIDTERM', 'FINAL', 'PRACTICAL', 'ASSIGNMENT', 'QUIZ']).default('MIDTERM'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
});

export const scheduleExamSubjectSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Exam date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:MM format').optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:MM format').optional(),
  maxMarks: z.number().min(1).default(100.0),
  passMarks: z.number().min(0).default(35.0),
});

export const enterMarksBulkSchema = z.object({
  examSubjectId: z.string().min(1, 'Exam Subject ID is required'),
  marks: z
    .array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        marksObtained: z.number().min(0).default(0.0),
        isAbsent: z.boolean().default(false),
        remarks: z.string().optional(),
      })
    )
    .min(1, 'At least one student mark entry is required'),
});

export const createGradeScaleSchema = z.object({
  name: z.string().min(1, 'Scale name is required (e.g. Standard 10-Point Scale)'),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  gradeLetter: z.string().min(1, 'Grade letter is required (e.g. A+, A, B)'),
  gradePoint: z.number().min(0).max(10).default(0.0),
  remarks: z.string().optional(),
});
