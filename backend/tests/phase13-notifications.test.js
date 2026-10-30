import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';

describe('Phase 13 — Outbound Notification Engine (WhatsApp / SMS / Event Triggers)', () => {
  let app;
  let adminToken;
  let teacherToken;
  let studentToken;
  let demoTenant;
  let testStudent;
  let testInvoice;
  let testPayment;

  before(async () => {
    await connectDatabase();
    app = createApp();

    demoTenant = await prisma.tenant.findUnique({ where: { code: 'GWIS' } });

    // 1. Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@greenwood.edu', password: 'Admin@Greenwood2026!' });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Authenticate Teacher
    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher.sharma@greenwood.edu', password: 'Teacher@Greenwood2026!' });
    teacherToken = teacherLogin.body.data.tokens.accessToken;

    // 3. Authenticate Student
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.aarav@greenwood.edu', password: 'Student@Greenwood2026!' });
    studentToken = studentLogin.body.data.tokens.accessToken;

    // 4. Find student Aarav
    testStudent = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id, admissionNumber: 'ADM-2025-001' },
      include: { user: true },
    });

    // 5. Find an active invoice and payment for testing triggers
    testInvoice = await prisma.invoice.findFirst({
      where: { tenantId: demoTenant.id, studentId: testStudent.id },
    });

    testPayment = await prisma.payment.findFirst({
      where: { tenantId: demoTenant.id, invoice: { studentId: testStudent.id } },
    });
  });

  after(async () => {
    try {
      await prisma.outboundNotification.deleteMany({
        where: { tenantId: demoTenant.id },
      });
    } catch (e) {
      // ignore
    }
    await disconnectDatabase();
  });

  // ==========================================
  // SECTION 1: OUTBOUND DISPATCH & STATS
  // ==========================================
  describe('Outbound Multi-Channel Dispatching', () => {
    test('Admin dispatches general announcement alert via WhatsApp', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/dispatch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventType: 'GENERAL_ANNOUNCEMENT',
          channel: 'WHATSAPP',
          recipientPhone: '+919876543210',
          recipientName: 'Greenwood Parents',
          title: 'Annual Sports Day 2026 Schedule',
          messageBody: 'Dear Parents, Greenwood Annual Sports Day will be held on Nov 15th from 09:00 AM.',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.eventType, 'GENERAL_ANNOUNCEMENT');
      assert.strictEqual(res.body.data.channel, 'WHATSAPP');
      assert.strictEqual(res.body.data.status, 'DELIVERED');
      assert.ok(res.body.data.externalId.startsWith('WA_MSG_'));
    });

    test('Admin lists dispatched notifications with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 1);
      assert.ok(res.body.meta.total >= 1);
    });

    test('Staff retrieves notification delivery analytics', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.totalNotifications >= 1);
      assert.ok(res.body.data.deliveredCount >= 1);
      assert.ok(res.body.data.deliveryRate > 0);
      assert.ok(res.body.data.channels.whatsapp >= 1);
    });
  });

  // ==========================================
  // SECTION 2: AUTOMATED EVENT TRIGGERS
  // ==========================================
  describe('Automated ERP Event Triggers (Absentee & Fee Alerts)', () => {
    test('Teacher triggers Absentee WhatsApp alert for Student Aarav', async () => {
      assert.ok(testStudent, 'Test student must exist');

      const res = await request(app)
        .post('/api/v1/notifications/triggers/absentee')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studentId: testStudent.id,
          date: '2026-10-31',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.studentId, testStudent.id);
      assert.ok(res.body.data.totalAlertsSent >= 1);

      const alert = res.body.data.alerts[0];
      assert.strictEqual(alert.eventType, 'STUDENT_ABSENT');
      assert.strictEqual(alert.channel, 'WHATSAPP');
      assert.strictEqual(alert.status, 'DELIVERED');
      assert.match(alert.messageBody, /marked ABSENT/i);
    });

    test('Admin triggers Fee Due reminder for student invoice', async () => {
      if (!testInvoice) return;

      const res = await request(app)
        .post('/api/v1/notifications/triggers/fee-due')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: testInvoice.id,
          daysBeforeDue: 3,
        });

      // If already settled, service throws error or sends reminder
      if (res.status === 200) {
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.invoiceId, testInvoice.id);
        assert.strictEqual(res.body.data.notification.eventType, 'FEE_DUE_REMINDER');
      } else {
        assert.strictEqual(res.status, 500);
        assert.match(res.body.message, /fully settled/i);
      }
    });

    test('Staff triggers instant payment receipt confirmation', async () => {
      if (!testPayment) return;

      const res = await request(app)
        .post('/api/v1/notifications/triggers/fee-receipt')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentId: testPayment.id,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.notification.eventType, 'FEE_PAYMENT_RECEIPT');
      assert.match(res.body.data.notification.messageBody, /received fee payment/i);
    });
  });

  // ==========================================
  // SECTION 3: RBAC AUTHORIZATION
  // ==========================================
  describe('RBAC & Role Separation on Notification Dispatch', () => {
    test('Student CANNOT dispatch outbound notifications (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/dispatch')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          eventType: 'GENERAL_ANNOUNCEMENT',
          channel: 'SMS',
          recipientPhone: '+919876543210',
          title: 'Fake Notice',
          messageBody: 'Should fail',
        });

      assert.strictEqual(res.status, 403);
    });
  });
});
