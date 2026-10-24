import { z } from 'zod';

export const createCampusSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Campus code must be at least 2 characters')
    .max(20, 'Campus code cannot exceed 20 characters')
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(3, 'Campus name must be at least 3 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  isMain: z.boolean().default(false),
});

export const updateCampusSchema = z.object({
  name: z.string().trim().min(3).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isMain: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
