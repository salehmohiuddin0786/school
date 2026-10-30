import crypto from 'crypto';
import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

/**
 * Creates an authorized payment gateway order (e.g., Razorpay/Cashfree standard specification).
 */
export async function createPaymentOrder(tenantId, { invoiceId, amount }, userId = null, req = null) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      },
      tenant: { select: { name: true, currencyCode: true } },
    },
  });

  if (!invoice) {
    const err = new Error('Invoice not found.');
    err.statusCode = 404;
    throw err;
  }

  const remainingBalance = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  const payAmount = Number(amount);

  if (payAmount <= 0) {
    const err = new Error('Payment amount must be greater than zero.');
    err.statusCode = 400;
    throw err;
  }

  if (payAmount > remainingBalance) {
    const err = new Error(`Payment amount (₹${payAmount}) exceeds current outstanding invoice balance (₹${remainingBalance}).`);
    err.statusCode = 400;
    throw err;
  }

  // Generate standardized gateway order identifier
  const gatewayOrderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const currency = invoice.tenant?.currencyCode || 'INR';

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE_PAYMENT_ORDER',
    entityType: 'INVOICE',
    entityId: invoiceId,
    newValues: { gatewayOrderId, amount: payAmount, currency },
    req,
  });

  return {
    gatewayOrderId,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: payAmount,
    amountInSubunits: Math.round(payAmount * 100), // e.g., paise
    currency,
    institutionName: invoice.tenant?.name || 'SchoolNext ERP',
    customer: {
      name: `${invoice.student.user.firstName} ${invoice.student.user.lastName}`.trim(),
      email: invoice.student.user.email,
      phone: invoice.student.user.phone || '',
    },
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_schoolnext_2026',
  };
}

/**
 * Verifies gateway webhook or client HMAC-SHA256 signature.
 */
export function verifyGatewaySignature(orderId, paymentId, signature, secret = null) {
  const webhookSecret = secret || process.env.RAZORPAY_KEY_SECRET || 'test_webhook_secret_key_2026';
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
}

/**
 * Processes confirmed payment webhook with atomic ledger reconciliation and idempotency guard.
 */
export async function processGatewayPaymentSuccess(tenantId, { invoiceId, gatewayOrderId, gatewayPaymentId, gatewaySignature, amount, paymentMethod = 'ONLINE_GATEWAY', notes }, recordedById = null, req = null) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  });

  if (!invoice) {
    const err = new Error('Invoice not found.');
    err.statusCode = 404;
    throw err;
  }

  // Idempotency: verify if this gateway payment reference was already recorded
  const existingPayment = await prisma.payment.findFirst({
    where: {
      tenantId,
      gatewayPaymentId,
    },
  });

  if (existingPayment) {
    return {
      success: true,
      idempotent: true,
      message: 'Payment was already processed and verified.',
      payment: existingPayment,
    };
  }

  const payAmount = Number(amount);
  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  if (payAmount > remaining) {
    const err = new Error(`Amount ₹${payAmount} exceeds remaining balance ₹${remaining}.`);
    err.statusCode = 400;
    throw err;
  }

  const transactionReference = `TXN-GW-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: payAmount,
        paymentMethod: paymentMethod === 'UPI' ? 'UPI' : 'ONLINE_GATEWAY',
        paymentStatus: 'SUCCESSFUL',
        transactionReference,
        gatewayOrderId,
        gatewayPaymentId,
        gatewaySignature,
        notes: notes || 'Verified online gateway transaction',
        recordedById: recordedById || 'SYSTEM_GATEWAY_WEBHOOK',
      },
    });

    const newPaidAmount = Number(invoice.paidAmount) + payAmount;
    const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return createdPayment;
  });

  await logAudit({
    tenantId,
    userId: recordedById,
    action: 'ONLINE_PAYMENT_CAPTURED',
    entityType: 'PAYMENT',
    entityId: payment.id,
    newValues: {
      gatewayOrderId,
      gatewayPaymentId,
      amount: payAmount,
      invoiceId,
    },
    req,
  });

  return {
    success: true,
    idempotent: false,
    message: 'Online payment captured and invoice balance reconciled successfully.',
    payment,
  };
}
