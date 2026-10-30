import { z } from 'zod';

export const createFeeStructureSchema = z.object({
  name: z.string().min(2, 'Fee structure name is required'),
  categoryId: z.string().optional(),
  courseId: z.string().optional().nullable(),
  academicYearId: z.string().min(1, 'Academic year is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'TERMLY', 'ANNUAL']).default('TERMLY'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
});

export const createInvoiceSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  academicYearId: z.string().min(1, 'Academic year ID is required'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  lines: z
    .array(
      z.object({
        description: z.string().min(2, 'Description is required'),
        amount: z.number().min(0.01, 'Line amount must be positive'),
        studentFeeId: z.string().optional().nullable(),
      })
    )
    .min(1, 'At least one invoice line is required'),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(0.01, 'Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE', 'DEMAND_DRAFT']).default('CASH'),
  transactionReference: z.string().min(3, 'Transaction reference/receipt number is required'),
  notes: z.string().optional().nullable(),
});

export const createFeeDiscountRuleSchema = z.object({
  name: z.string().min(2, 'Discount rule name is required'),
  code: z.string().min(2, 'Unique discount rule code is required'),
  description: z.string().optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  value: z.number().min(0, 'Discount value must be non-negative'),
  applicableOn: z.enum(['TUITION_ONLY', 'TRANSPORT_ONLY', 'ALL_HEADS']).default('TUITION_ONLY'),
  isAutomatic: z.boolean().default(false),
  criteria: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const evaluateDiscountSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  baseAmount: z.number().min(0, 'Base amount is required'),
  categoryName: z.string().optional(),
});

export const reversePaymentSchema = z.object({
  reason: z.string().min(5, 'Reversal reason must be at least 5 characters'),
  notes: z.string().optional().nullable(),
});

export const createGatewayOrderSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(1, 'Order amount must be at least ₹1'),
});

export const processWebhookSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  gatewayOrderId: z.string().min(1, 'Gateway order ID is required'),
  gatewayPaymentId: z.string().min(1, 'Gateway payment ID is required'),
  gatewaySignature: z.string().optional().nullable(),
  amount: z.number().min(0.01, 'Payment amount must be greater than zero'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional().nullable(),
});
