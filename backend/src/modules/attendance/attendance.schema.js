import { z } from 'zod';

export const recordDailyAttendanceSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED']),
        remarks: z.string().optional(),
      })
    )
    .min(1, 'At least one student attendance record is required'),
});

export const updateSingleAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED']),
  remarks: z.string().min(1, 'Reason/remarks for attendance adjustment is required'),
});

export const applyStaffLeaveSchema = z.object({
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'UNPAID']).default('CASUAL'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  reason: z.string().min(3, 'Reason is required'),
});

export const reviewStaffLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  approvalRemarks: z.string().optional(),
});
