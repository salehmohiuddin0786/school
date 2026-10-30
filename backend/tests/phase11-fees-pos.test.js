import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';

describe('Phase 11 — Fee Engine, Concessions, POS Cashier & Reversal Tests', () => {
  let app;
  let adminToken;
  let studentToken;
  let parentToken;
  let demoTenant;
  let currentYear;
  let testStudent;
  let createdInvoice;
  let recordedPaymentId;

  before(async () => {
    await connectDatabase();
    app = createApp();

    demoTenant = await prisma.tenant.findUnique({ where: { code: 'GWIS' } });
    currentYear = await prisma.academicYear.findFirst({
      where: { tenantId: demoTenant.id, isCurrent: true },
    });

    // 1. Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@greenwood.edu', password: 'Admin@Greenwood2026!' });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Authenticate Student Aarav
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.aarav@greenwood.edu', password: 'Student@Greenwood2026!' });
    studentToken = studentLogin.body.data.tokens.accessToken;

    // 3. Authenticate Parent Patel
    const parentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'parent.patel@greenwood.edu', password: 'Parent@Greenwood2026!' });
    parentToken = parentLogin.body.data.tokens.accessToken;

    // 4. Find student profile
    testStudent = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id },
      include: { user: true },
    });
  });

  after(async () => {
    await disconnectDatabase();
  });

  describe('Fee Discount & Concession Rules Engine', () => {
    test('Admin creates a 20% Sibling Discount Rule', async () => {
      const code = `SIBLING_2ND_${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/v1/fees/discounts/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sibling Concession 20%',
          code,
          discountType: 'PERCENTAGE',
          value: 20,
          applicableOn: 'TUITION_ONLY',
          isAutomatic: true,
          criteria: { siblingOrder: 2 },
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(Number(res.body.data.value), 20);
    });

    test('Evaluates discount eligibility for student with base tuition ₹30,000', async () => {
      const res = await request(app)
        .post('/api/v1/fees/discounts/evaluate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: testStudent.id,
          baseAmount: 30000,
          categoryName: 'Tuition Fee',
        });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.studentId);
      assert.strictEqual(typeof res.body.data.netPayable, 'number');
      assert.strictEqual(typeof res.body.data.siblingOrder, 'number');
    });
  });

  describe('Multi-Head Invoicing & Cashier POS Collection', () => {
    test('Admin generates multi-head invoice (Tuition, Transport, Lab)', async () => {
      const res = await request(app)
        .post('/api/v1/fees/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: testStudent.id,
          academicYearId: currentYear.id,
          dueDate: '2026-11-30',
          lines: [
            { description: 'Term 1 Tuition Fee', amount: 25000 },
            { description: 'Transport Fee (Zone 2)', amount: 6000 },
            { description: 'Science Lab & Tech Fee', amount: 4000 },
          ],
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(Number(res.body.data.totalAmount), 35000);
      assert.strictEqual(res.body.data.lines.length, 3);
      createdInvoice = res.body.data;
    });

    test('Cashier collects partial payment (₹15,000 via CASH) at counter', async () => {
      const txnRef = `REC-POS-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/fees/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: createdInvoice.id,
          amount: 15000,
          paymentMethod: 'CASH',
          transactionReference: txnRef,
          notes: 'Counter fee collection with instant receipt',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(Number(res.body.data.amount), 15000);
      assert.strictEqual(res.body.data.paymentStatus, 'SUCCESSFUL');
      recordedPaymentId = res.body.data.id;

      // Verify invoice state updated to PARTIALLY_PAID
      const invCheck = await request(app)
        .get(`/api/v1/fees/invoices/${createdInvoice.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(invCheck.body.data.status, 'PARTIALLY_PAID');
      assert.strictEqual(Number(invCheck.body.data.paidAmount), 15000);
    });

    test('Rejects payment exceeding remaining balance (₹25,000 > ₹20,000)', async () => {
      const res = await request(app)
        .post('/api/v1/fees/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: createdInvoice.id,
          amount: 25000,
          paymentMethod: 'UPI',
          transactionReference: `REC-OVER-${Date.now()}`,
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /cannot exceed remaining invoice balance/i);
    });
  });

  describe('Online Payment Gateway Order & Webhook Capture', () => {
    let gatewayOrderId;

    test('Creates authorized payment gateway order with subunits', async () => {
      const res = await request(app)
        .post('/api/v1/fees/gateway/order')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          invoiceId: createdInvoice.id,
          amount: 5000,
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.data.gatewayOrderId.startsWith('order_'));
      assert.strictEqual(res.body.data.amountInSubunits, 500000); // 5000 * 100
      gatewayOrderId = res.body.data.gatewayOrderId;
    });

    test('Captures online payment webhook and updates invoice balance', async () => {
      const gatewayPaymentId = `pay_rzp_${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/fees/gateway/webhook')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: createdInvoice.id,
          gatewayOrderId,
          gatewayPaymentId,
          gatewaySignature: 'sig_test_verified',
          amount: 5000,
          paymentMethod: 'ONLINE_GATEWAY',
          notes: 'Razorpay UPI payment confirmed',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.success, true);
      assert.strictEqual(res.body.data.idempotent, false);

      // Verify idempotent repeat
      const repeatRes = await request(app)
        .post('/api/v1/fees/gateway/webhook')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: createdInvoice.id,
          gatewayOrderId,
          gatewayPaymentId,
          amount: 5000,
        });

      assert.strictEqual(repeatRes.status, 200);
      assert.strictEqual(repeatRes.body.data.idempotent, true);
    });
  });

  describe('Day-End Cash Book & Defaulter Reports', () => {
    test('Calculates Day-End Cash Book balancing drawer mode breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/fees/cash-book/day-end')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.grossCollected >= 20000);
      assert.ok(res.body.data.cashInDrawer >= 15000);
      assert.ok(res.body.data.methodBreakdown.CASH);
      assert.ok(res.body.data.transactions.length >= 2);
    });

    test('Retrieves overdue defaulters list', async () => {
      const res = await request(app)
        .get('/api/v1/fees/defaulters')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });
  });

  describe('Immutable Payment Reversal Voucher Workflow', () => {
    test('Reverses cashier payment, issues reversal voucher and restores balance', async () => {
      const res = await request(app)
        .post(`/api/v1/fees/payments/${recordedPaymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Duplicate check-in entry error by counter clerk',
          notes: 'Supervisor authorized adjustment',
        });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.reversalVoucherNo.startsWith('REV-'));
      assert.strictEqual(res.body.data.reversedAmount, 15000);

      // Verify invoice balance was restored
      const invCheck = await request(app)
        .get(`/api/v1/fees/invoices/${createdInvoice.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Previously 20,000 paid (15k cash + 5k gateway). Reversed 15k -> 5k remaining paid
      assert.strictEqual(Number(invCheck.body.data.paidAmount), 5000);
      assert.strictEqual(invCheck.body.data.status, 'PARTIALLY_PAID');
    });

    test('Rejects duplicate reversal of already reversed payment', async () => {
      const res = await request(app)
        .post(`/api/v1/fees/payments/${recordedPaymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Attempting second reversal on same payment',
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /already reversed/i);
    });
  });
});
