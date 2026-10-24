import { z } from 'zod';

export const createTeacherSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Valid faculty email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone: z.string().optional(),
  campusId: z.string().optional(),

  // Teacher Profile
  employeeCode: z.string().trim().min(2, 'Employee code is required').transform((v) => v.toUpperCase()),
  designation: z.string().default('Teacher'),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  joiningDate: z.string().transform((v) => new Date(v)).optional(),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().optional(),
  campusId: z.string().optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
});
