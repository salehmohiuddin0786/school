import { z } from 'zod';

export const createTenantSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, hyphens, and underscores')
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(3, 'Institution name must be at least 3 characters'),
  type: z.enum(['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'INSTITUTE']).default('SCHOOL'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required').optional(),
  website: z.string().url().optional().or(z.literal('')),
  timezone: z.string().default('Asia/Kolkata'),
  currencyCode: z.string().default('INR'),
  adminEmail: z.string().email('Admin email is required'),
  adminFirstName: z.string().min(1, 'Admin first name is required'),
  adminLastName: z.string().min(1, 'Admin last name is required'),
  adminPassword: z.string().min(8, 'Admin password must be at least 8 characters'),
});

export const updateTenantSchema = z.object({
  name: z.string().trim().min(3).optional(),
  type: z.enum(['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'INSTITUTE']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  timezone: z.string().optional(),
  currencyCode: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

export const updateTenantStatusSchema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']),
  reason: z.string().optional(),
});
