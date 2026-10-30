import { z } from 'zod';

export const createRouteSchema = z.object({
  campusId: z.string().uuid().optional(),
  routeName: z.string().min(1).max(191),
  startPoint: z.string().min(1).max(191),
  endPoint: z.string().min(1).max(191),
  stops: z.array(z.any()).optional(),
  fare: z.number().min(0).optional(),
});

export const registerVehicleSchema = z.object({
  campusId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  registrationNumber: z.string().min(1).max(100),
  model: z.string().max(100).optional(),
  capacity: z.number().int().min(1).max(200).default(30),
  driverName: z.string().max(100).optional(),
  driverPhone: z.string().max(50).optional(),
});

export const catalogBookSchema = z.object({
  campusId: z.string().uuid().optional(),
  isbn: z.string().max(50).optional(),
  title: z.string().min(1).max(255),
  author: z.string().min(1).max(191),
  publisher: z.string().max(191).optional(),
  edition: z.string().max(50).optional(),
  totalCopies: z.number().int().min(1).default(1),
  rackLocation: z.string().max(100).optional(),
});

export const issueBookSchema = z.object({
  bookId: z.string().uuid(),
  userId: z.string().uuid(),
  daysAllowed: z.number().int().min(1).max(90).default(14),
});

export const returnBookSchema = z.object({
  fineOverride: z.number().min(0).optional(),
});

export const addInventorySchema = z.object({
  campusId: z.string().uuid().optional(),
  itemName: z.string().min(1).max(191),
  category: z.string().max(100).optional(),
  quantity: z.number().int().min(0).default(0),
  unit: z.string().max(50).default('units'),
  unitPrice: z.number().min(0).default(0),
  location: z.string().max(100).optional(),
});

export const adjustStockSchema = z.object({
  quantityDelta: z.number().int(),
  reason: z.string().min(1).max(255),
});
