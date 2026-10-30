import { z } from 'zod';

export const dispatchNotificationSchema = z.object({
  eventType: z.enum([
    'STUDENT_ABSENT',
    'FEE_DUE_REMINDER',
    'FEE_PAYMENT_RECEIPT',
    'EXAM_RESULT_PUBLISHED',
    'GENERAL_ANNOUNCEMENT',
    'BUS_DELAY_ALERT',
  ]),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL', 'PUSH', 'IN_APP']).default('WHATSAPP'),
  recipientPhone: z.string().max(50).optional(),
  recipientEmail: z.string().email().max(191).optional(),
  recipientUserId: z.string().uuid().optional(),
  recipientName: z.string().max(191).optional(),
  templateCode: z.string().max(100).optional(),
  title: z.string().min(1).max(255),
  messageBody: z.string().min(1),
  payload: z.record(z.any()).optional(),
});

export const triggerAbsenteeSchema = z.object({
  studentId: z.string().uuid(),
  date: z.string().optional(),
});

export const triggerFeeDueSchema = z.object({
  invoiceId: z.string().uuid(),
  daysBeforeDue: z.number().int().min(0).max(30).optional(),
});

export const triggerFeeReceiptSchema = z.object({
  paymentId: z.string().uuid(),
});
