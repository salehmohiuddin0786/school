import { z } from 'zod';

export const createAssignmentSchema = z.object({
  classSubjectId: z.string().min(1, 'Class Subject ID is required'),
  teacherProfileId: z.string().optional(),
  title: z.string().trim().min(3, 'Assignment title is required'),
  description: z.string().optional(),
  dueDate: z.string().min(10, 'Due date is required (YYYY-MM-DD or ISO string)'),
  maxMarks: z.number().min(1).default(20.0),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
});

export const submitAssignmentSchema = z
  .object({
    submissionText: z.string().optional(),
    fileUrl: z.string().optional(),
  })
  .refine((data) => data.submissionText || data.fileUrl, {
    message: 'Either submission text or a file URL must be provided',
  });

export const gradeSubmissionSchema = z.object({
  marksAwarded: z.number().min(0, 'Marks awarded must be non-negative'),
  feedback: z.string().optional(),
  status: z.enum(['GRADED', 'RESUBMIT_REQUESTED']).default('GRADED'),
});

export const createLearningMaterialSchema = z.object({
  classSubjectId: z.string().min(1, 'Class Subject ID is required'),
  teacherProfileId: z.string().optional(),
  title: z.string().trim().min(3, 'Material title is required'),
  description: z.string().optional(),
  fileUrl: z.string().min(1, 'File URL or external resource link is required'),
  fileType: z.enum(['PDF', 'VIDEO', 'DOC', 'LINK']).default('PDF'),
  isPublished: z.boolean().default(true),
});
