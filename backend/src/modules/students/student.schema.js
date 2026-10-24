import { z } from 'zod';

export const admitStudentSchema = z.object({
  // Basic & User Info
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Valid student email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone: z.string().optional(),
  campusId: z.string().optional(),

  // Academic Enrollment
  admissionNumber: z.string().trim().min(1, 'Admission number is required').transform((v) => v.toUpperCase()),
  admissionDate: z.string().transform((v) => new Date(v)).optional(),
  dateOfBirth: z.string().transform((v) => new Date(v)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),

  // Address
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),

  // Initial Section Enrollment
  sectionId: z.string().optional(),
  academicYearId: z.string().optional(),
  rollNumber: z.string().optional(),

  // Optional Parent Information for simultaneous registration
  parent: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']).default('FATHER'),
      occupation: z.string().optional(),
      isPrimaryContact: z.boolean().default(true),
    })
    .optional(),
});

export const updateStudentSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().transform((v) => new Date(v)).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  campusId: z.string().optional(),
});

export const enrollStudentSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  academicYearId: z.string().min(1, 'Academic Year ID is required'),
  rollNumber: z.string().optional(),
});
