import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role code is required'),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().optional(),
  roles: z.array(z.string()).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']),
});
