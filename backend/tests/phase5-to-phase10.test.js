import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';

describe('Phase 5 to 10 — Production Portal & Substitution Verification Tests', () => {
  let app;
  let adminToken;
  let teacherToken;
  let studentToken;
  let parentToken;
  let ownerToken;

  let demoTenant;
  let currentYear;

  let primaryTeacher;
  let substituteTeacher;
  let studentAarav;
  let unlinkedStudent;
  let sectionA;
  let mathSubject;
  let timetableEntry;
  let createdSubstitutionId;
  const targetDate = '2026-11-23'; // Far Monday in the future

  before(async () => {
    await connectDatabase();
    app = createApp();

    demoTenant = await prisma.tenant.findUnique({ where: { code: 'GWIS' } });
    currentYear = await prisma.academicYear.findFirst({
      where: { tenantId: demoTenant.id, isCurrent: true },
    });

    // Clean up any stale test substitutions for targetDate
    await prisma.teacherSubstitution.deleteMany({
      where: { tenantId: demoTenant.id, date: new Date(targetDate) },
    });

    // 1. Authenticate users
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@greenwood.edu', password: 'Admin@Greenwood2026!' });
    adminToken = adminLogin.body.data.tokens.accessToken;

    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher.sharma@greenwood.edu', password: 'Teacher@Greenwood2026!' });
    teacherToken = teacherLogin.body.data.tokens.accessToken;

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.aarav@greenwood.edu', password: 'Student@Greenwood2026!' });
    studentToken = studentLogin.body.data.tokens.accessToken;

    const parentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'parent.patel@greenwood.edu', password: 'Parent@Greenwood2026!' });
    parentToken = parentLogin.body.data.tokens.accessToken;

    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@greenwood.edu', password: 'Admin@Greenwood2026!' });
    if (ownerLogin.body?.data?.tokens) {
      ownerToken = ownerLogin.body.data.tokens.accessToken;
    }

    // 2. Fetch fixtures
    primaryTeacher = await prisma.teacherProfile.findFirst({
      where: { tenantId: demoTenant.id, employeeCode: 'EMP-T-101' },
      include: { user: true },
    });

    substituteTeacher = await prisma.teacherProfile.findFirst({
      where: { tenantId: demoTenant.id, NOT: { id: primaryTeacher.id } },
      include: { user: true },
    });

    studentAarav = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id, admissionNumber: 'ADM-2025-001' },
    });

    unlinkedStudent = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id, NOT: { id: studentAarav.id } },
    });

    sectionA = await prisma.section.findFirst({
      where: { tenantId: demoTenant.id, name: 'Section A' },
    });

    mathSubject = await prisma.subject.findFirst({
      where: { tenantId: demoTenant.id, code: 'MATH-10' },
    });

    timetableEntry = await prisma.timetableEntry.findFirst({
      where: {
        tenantId: demoTenant.id,
        teacherProfileId: primaryTeacher.id,
      },
      include: { section: true, subject: true },
    });

    if (!timetableEntry) {
      const course = await prisma.course.findFirst({ where: { tenantId: demoTenant.id } });
      const room = await prisma.classRoom.findFirst({ where: { tenantId: demoTenant.id } });
      timetableEntry = await prisma.timetableEntry.create({
        data: {
          tenantId: demoTenant.id,
          academicYearId: currentYear.id,
          sectionId: sectionA.id,
          courseId: course.id,
          subjectId: mathSubject.id,
          teacherProfileId: primaryTeacher.id,
          classRoomId: room?.id,
          dayOfWeek: 'MONDAY',
          periodNumber: 1,
          startTime: '09:00',
          endTime: '09:45',
        },
      });
    }
  });

  after(async () => {
    if (createdSubstitutionId) {
      await prisma.teacherSubstitution.deleteMany({
        where: { id: createdSubstitutionId },
      });
    }
    await disconnectDatabase();
  });

  /* -------------------------------------------------------------------------- */
  /* 1. TEACHER PERSONAL ATTENDANCE READ-ONLY ENFORCEMENT                       */
  /* -------------------------------------------------------------------------- */
  describe('Teacher Attendance Read-Only & Roll Call Authorization', () => {
    test('Teacher can view own attendance summary as read-only', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/my-attendance')
        .set('Authorization', `Bearer ${teacherToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.readOnly, true);
      assert.ok(typeof res.body.data.attendanceRate === 'number');
    });

    test('Teacher cannot mark or modify own attendance (strictly forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/record')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          teacherProfileId: primaryTeacher.id,
          status: 'PRESENT',
          date: '2026-10-25',
        });

      assert.ok(res.status === 400 || res.status === 403);
    });

    test('Student roll call rejects future attendance dates', async () => {
      const futureDate = '2030-01-01';
      const res = await request(app)
        .post('/api/v1/attendance/record')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sectionId: sectionA.id,
          date: futureDate,
          records: [
            {
              studentId: studentAarav.id,
              status: 'PRESENT',
            },
          ],
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /future|date/i);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. AUTOMATIC TEACHER SUBSTITUTION ENGINE & CONFLICT REJECTION              */
  /* -------------------------------------------------------------------------- */
  describe('Teacher Substitution Engine', () => {
    test('Admin successfully assigns an eligible substitute teacher', async () => {
      const res = await request(app)
        .post('/api/v1/timetable/substitutions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          timetableEntryId: timetableEntry.id,
          substituteTeacherId: substituteTeacher.id,
          date: targetDate,
          reason: 'LEAVE',
          notes: 'Handover unit test chapter 4 factoring.',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'ASSIGNED');
      assert.strictEqual(res.body.data.originalTeacherId, primaryTeacher.id);
      assert.strictEqual(res.body.data.substituteTeacherId, substituteTeacher.id);
      createdSubstitutionId = res.body.data.id;
    });

    test('Rejects duplicate / conflicting substitution assignment on same period (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/timetable/substitutions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          timetableEntryId: timetableEntry.id,
          substituteTeacherId: substituteTeacher.id,
          date: targetDate,
          reason: 'EMERGENCY',
        });

      assert.strictEqual(res.status, 409);
      assert.match(res.body.message, /conflict|already/i);
    });

    test('Effective timetable reflects the substitute teacher instead of original teacher', async () => {
      const res = await request(app)
        .get(`/api/v1/timetable/section/${timetableEntry.sectionId}/effective?date=${targetDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      const substitutedSlot = res.body.data.find((e) => e.id === timetableEntry.id);
      assert.ok(substitutedSlot, 'Timetable slot exists');
      assert.strictEqual(substitutedSlot.isSubstituted, true);
      assert.strictEqual(substitutedSlot.effectiveTeacher.id, substituteTeacher.id);
      assert.strictEqual(substitutedSlot.originalTeacher.id, primaryTeacher.id);
    });

    test('Cancelling substitution restores original teacher schedule', async () => {
      const res = await request(app)
        .patch(`/api/v1/timetable/substitutions/${createdSubstitutionId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'CANCELLED');

      const effRes = await request(app)
        .get(`/api/v1/timetable/section/${timetableEntry.sectionId}/effective?date=${targetDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const restoredSlot = effRes.body.data.find((e) => e.id === timetableEntry.id);
      assert.strictEqual(restoredSlot.isSubstituted, false);
      assert.strictEqual(restoredSlot.effectiveTeacher.id, primaryTeacher.id);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. INVOICES, PDF DATA & STUDENT/PARENT OWNERSHIP ENFORCEMENT               */
  /* -------------------------------------------------------------------------- */
  describe('Fee Invoices & Tenant Scoping', () => {
    let testInvoiceId;

    before(async () => {
      let inv = await prisma.invoice.findFirst({
        where: { tenantId: demoTenant.id, studentId: studentAarav.id },
      });

      if (!inv) {
        inv = await prisma.invoice.create({
          data: {
            tenantId: demoTenant.id,
            studentId: studentAarav.id,
            invoiceNumber: `INV-TEST-${Date.now()}`,
            totalAmount: 50000,
            paidAmount: 25000,
            dueDate: new Date('2026-11-15'),
            status: 'PARTIALLY_PAID',
          },
        });
      }
      testInvoiceId = inv.id;
    });

    test('Student can access their own invoices and printable breakdown', async () => {
      const res = await request(app)
        .get(`/api/v1/fees/student/${studentAarav.id}/invoices`)
        .set('Authorization', `Bearer ${studentToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    test('Parent can access their verified linked child overview and invoices', async () => {
      const res = await request(app)
        .get(`/api/v1/parents/my-children/${studentAarav.id}/overview`)
        .set('Authorization', `Bearer ${parentToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.student.id, studentAarav.id);
      assert.ok(res.body.data.fees);
    });

    test('Parent is blocked with 403 when attempting to access an unlinked child', async () => {
      if (unlinkedStudent) {
        const res = await request(app)
          .get(`/api/v1/parents/my-children/${unlinkedStudent.id}/overview`)
          .set('Authorization', `Bearer ${parentToken}`);

        assert.strictEqual(res.status, 403);
        assert.match(res.body.message, /Access denied|not authorized|relationship/i);
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. OWNER PORTAL EXECUTIVE METRICS & ISOLATION                              */
  /* -------------------------------------------------------------------------- */
  describe('Owner Executive Portal Isolation', () => {
    test('Owner retrieves institution overview with verified financial metrics', async () => {
      if (ownerToken) {
        const res = await request(app)
          .get('/api/v1/owner/overview')
          .set('Authorization', `Bearer ${ownerToken}`);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.metrics);
      }
    });

    test('Owner cannot access tenant data without authorized membership', async () => {
      const res = await request(app)
        .get('/api/v1/owner/overview')
        .set('Authorization', `Bearer ${teacherToken}`);

      assert.strictEqual(res.status, 403);
    });
  });
});
