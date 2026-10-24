import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';

describe('Phase 3 — Academics & Attendance Integration Tests', () => {
  let app;
  let adminToken;
  let teacherToken;
  let studentToken;
  let parentToken;
  let demoTenant;

  let testTeacher;
  let testStudent;
  let testSection;
  let testSubject;
  let testClassSubject;
  let testClassRoom;
  let currentYear;
  let createdTimetableId;
  let createdAttendanceId;
  let createdLeaveId;

  before(async () => {
    await connectDatabase();
    app = createApp();

    demoTenant = await prisma.tenant.findUnique({ where: { code: 'GWIS' } });
    currentYear = await prisma.academicYear.findFirst({
      where: { tenantId: demoTenant.id, isCurrent: true },
    });

    // 1. Get tokens
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

    // 2. Fetch fixtures from seed
    testTeacher = await prisma.teacherProfile.findFirst({
      where: { tenantId: demoTenant.id, employeeCode: 'EMP-T-101' },
    });
    testStudent = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id, admissionNumber: 'ADM-2025-001' },
    });
    testSubject = await prisma.subject.findFirst({
      where: { tenantId: demoTenant.id, code: 'MATH-10' },
    });
    testSection = await prisma.section.findFirst({
      where: { tenantId: demoTenant.id, name: 'Section A' },
    });
    testClassSubject = await prisma.classSubject.findFirst({
      where: { tenantId: demoTenant.id, sectionId: testSection.id, subjectId: testSubject.id },
    });
    testClassRoom = await prisma.classRoom.findFirst({
      where: { tenantId: demoTenant.id, roomNumber: '101' },
    });
  });

  after(async () => {
    // Teardown timetable and leave fixtures
    try {
      if (createdTimetableId) {
        await prisma.timetableEntry.deleteMany({ where: { id: createdTimetableId } });
      }
      if (createdLeaveId) {
        await prisma.leaveRequest.deleteMany({ where: { id: createdLeaveId } });
      }
    } catch (e) {}

    await disconnectDatabase();
  });

  // -----------------------------------------------------------
  // 1. TIMETABLE & CONFLICT DETECTION
  // -----------------------------------------------------------
  test('POST /api/v1/timetable/entries schedules a class slot cleanly', async () => {
    const res = await request(app)
      .post('/api/v1/timetable/entries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sectionId: testSection.id,
        subjectId: testSubject.id,
        teacherProfileId: testTeacher.id,
        classRoomId: testClassRoom.id,
        dayOfWeek: 2, // Tuesday
        startTime: '09:00',
        endTime: '10:00',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.dayOfWeek, 2);
    assert.strictEqual(res.body.data.startTime, '09:00');
    assert.strictEqual(res.body.data.endTime, '10:00');
    createdTimetableId = res.body.data.id;
  });

  test('Conflict Detection: Rejects scheduling same teacher during overlapping time (409 Conflict)', async () => {
    // Attempt to schedule same teacher on Tuesday 09:30 - 10:30
    const res = await request(app)
      .post('/api/v1/timetable/entries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sectionId: testSection.id,
        subjectId: testSubject.id,
        teacherProfileId: testTeacher.id,
        dayOfWeek: 2, // Tuesday
        startTime: '09:30', // Overlaps with 09:00 - 10:00
        endTime: '10:30',
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Teacher') && res.body.message.includes('already scheduled'));
  });

  test('Conflict Detection: Rejects scheduling same section during overlapping time (409 Conflict)', async () => {
    // Another teacher, same section on Tuesday 09:15 - 09:45
    // Create secondary teacher if needed
    const otherTeacher = await prisma.teacherProfile.findFirst({
      where: { tenantId: demoTenant.id, NOT: { id: testTeacher.id } },
    });

    if (otherTeacher) {
      const res = await request(app)
        .post('/api/v1/timetable/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sectionId: testSection.id, // Overlapping section
          subjectId: testSubject.id,
          teacherProfileId: otherTeacher.id,
          dayOfWeek: 2,
          startTime: '09:15',
          endTime: '09:45',
        });

      assert.strictEqual(res.status, 409);
      assert.ok(res.body.message.includes('Section') && res.body.message.includes('already scheduled'));
    }
  });

  test('Conflict Detection: Rejects booking same classroom during overlapping time (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/timetable/entries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sectionId: testSection.id,
        subjectId: testSubject.id,
        teacherProfileId: testTeacher.id,
        classRoomId: testClassRoom.id, // Same room
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '10:00',
      });

    assert.strictEqual(res.status, 409);
  });

  test('GET /api/v1/timetable/section/:sectionId retrieves class timetable', async () => {
    const res = await request(app)
      .get(`/api/v1/timetable/section/${testSection.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((e) => e.startTime === '09:00'));
  });

  test('GET /api/v1/timetable/my-schedule returns timetable for logged-in student', async () => {
    const res = await request(app)
      .get('/api/v1/timetable/my-schedule')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  // -----------------------------------------------------------
  // 2. DAILY ATTENDANCE & CORRECTION AUDITING
  // -----------------------------------------------------------
  test('POST /api/v1/attendance/record submits daily section attendance in bulk', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/record')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        sectionId: testSection.id,
        date: '2026-10-24',
        records: [
          {
            studentId: testStudent.id,
            status: 'PRESENT',
            remarks: 'On time for mathematics session',
          },
        ],
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.strictEqual(res.body.data[0].status, 'PRESENT');
    createdAttendanceId = res.body.data[0].id;
  });

  test('PUT /api/v1/attendance/:id authorizes attendance correction and logs audit', async () => {
    const res = await request(app)
      .put(`/api/v1/attendance/${createdAttendanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'LATE',
        remarks: 'Bus breakdown on Varthur main road',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'LATE');
    assert.strictEqual(res.body.data.remarks, 'Bus breakdown on Varthur main road');

    // Verify audit log entry was created
    const audit = await prisma.auditLog.findFirst({
      where: {
        tenantId: demoTenant.id,
        action: 'CORRECT_ATTENDANCE',
        entityId: createdAttendanceId,
      },
    });
    assert.ok(audit);
  });

  test('GET /api/v1/attendance/student/:studentId/summary calculates attendance percentage', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/student/${testStudent.id}/summary`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.data.percentage === 'number');
    assert.ok(res.body.data.totalDays >= 1);
    assert.ok(['SATISFACTORY', 'ATTENDANCE_DEFICIENT'].includes(res.body.data.status));
  });

  test('GET /api/v1/attendance/section/:sectionId/stats returns daily section statistics', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/section/${testSection.id}/stats?date=2026-10-24`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.date, '2026-10-24');
    assert.ok(typeof res.body.data.totalEnrolled === 'number');
    assert.ok(typeof res.body.data.attendanceRate === 'number');
  });

  // -----------------------------------------------------------
  // 3. STAFF LEAVE MANAGEMENT
  // -----------------------------------------------------------
  test('POST /api/v1/attendance/leaves/apply allows faculty to apply for leave', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/leaves/apply')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        leaveType: 'CASUAL',
        startDate: '2026-11-01',
        endDate: '2026-11-02',
        reason: 'Attending regional mathematics pedagogy conference',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.status, 'PENDING');
    assert.strictEqual(res.body.data.totalDays, 2);
    createdLeaveId = res.body.data.id;
  });

  test('PATCH /api/v1/attendance/leaves/:id/review authorizes admin approval', async () => {
    const res = await request(app)
      .patch(`/api/v1/attendance/leaves/${createdLeaveId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        approvalRemarks: 'Conference attendance approved with full duty allowance',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'APPROVED');
    assert.strictEqual(res.body.data.approvalRemarks, 'Conference attendance approved with full duty allowance');
  });

  test('GET /api/v1/attendance/leaves lists leave requests for administration', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/leaves')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((l) => l.id === createdLeaveId));
  });
});
