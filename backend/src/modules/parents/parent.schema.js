import { z } from 'zod';

export const createParentSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(8).optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  occupation: z.string().optional(),
  annualIncome: z.number().optional(),
  address: z.string().optional(),
});

export const updateParentSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  occupation: z.string().optional(),
  annualIncome: z.number().optional(),
  address: z.string().optional(),
});

export const linkStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']).default('FATHER'),
  isPrimaryContact: z.boolean().default(false),
  canPickup: z.boolean().default(true),
});
