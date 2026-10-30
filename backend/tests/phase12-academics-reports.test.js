import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';

describe('Phase 12 — Academic Engine, Period Attendance & Board Report Cards', () => {
  let app;
  let adminToken;
  let teacherToken;
  let studentToken;
  let studentRohanToken;
  let demoTenant;
  let currentYear;
  let studentAarav;
  let studentRohan;
  let timetableEntry;
  let mathSubject;
  let createdExamId;
  let createdExamSubjectId;

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

    // 2. Authenticate Teacher
    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher.sharma@greenwood.edu', password: 'Teacher@Greenwood2026!' });
    teacherToken = teacherLogin.body.data.tokens.accessToken;

    // 3. Authenticate Student Aarav
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.aarav@greenwood.edu', password: 'Student@Greenwood2026!' });
    studentToken = studentLogin.body.data.tokens.accessToken;

    // 4. Find students
    studentAarav = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id, admissionNumber: 'ADM-2025-001' },
      include: { user: true },
    });
    studentRohan = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id, admissionNumber: 'ADM-2025-002' },
      include: { user: true },
    });

    // 5. Find timetable entry and subject
    timetableEntry = await prisma.timetableEntry.findFirst({
      where: { tenantId: demoTenant.id },
      include: { subject: true, section: true },
    });

    mathSubject = await prisma.subject.findFirst({
      where: { tenantId: demoTenant.id, code: 'MATH-10' },
    });
  });

  after(async () => {
    try {
      if (createdExamId) {
        await prisma.reportCard.deleteMany({ where: { examId: createdExamId } });
        if (createdExamSubjectId) {
          await prisma.markEntry.deleteMany({ where: { examSubjectId: createdExamSubjectId } });
          await prisma.examSubject.deleteMany({ where: { id: createdExamSubjectId } });
        }
        await prisma.exam.deleteMany({ where: { id: createdExamId } });
      }
      if (timetableEntry && studentAarav) {
        await prisma.periodAttendance.deleteMany({
          where: { timetableEntryId: timetableEntry.id, studentId: studentAarav.id },
        });
      }
    } catch (e) {
      // ignore cleanup errors
    }
    await disconnectDatabase();
  });

  // ==========================================
  // SECTION 1: PERIOD-WISE ATTENDANCE
  // ==========================================
  describe('Period-Wise Attendance Recording & Query', () => {
    const today = new Date().toISOString().split('T')[0];

    test('Teacher records period attendance for students', async () => {
      assert.ok(timetableEntry, 'Timetable entry must exist in database');
      assert.ok(studentAarav, 'Student Aarav must exist in database');

      const res = await request(app)
        .post('/api/v1/attendance/period')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          timetableEntryId: timetableEntry.id,
          date: today,
          records: [
            {
              studentId: studentAarav.id,
              status: 'PRESENT',
              remarks: 'Active in geometry problem solving',
            },
            ...(studentRohan
              ? [
                  {
                    studentId: studentRohan.id,
                    status: 'LATE',
                    remarks: 'Arrived 10 mins late',
                  },
                ]
              : []),
          ],
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.totalMarked >= 1);
    });

    test('Teacher queries period attendance for timetable slot and date', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/period/${timetableEntry.id}/date/${today}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.slot.id, timetableEntry.id);
      assert.ok(Array.isArray(res.body.data.records));
      assert.ok(res.body.data.records.length >= 1);

      const aaravRecord = res.body.data.records.find((a) => a.studentId === studentAarav.id);
      assert.ok(aaravRecord);
      assert.strictEqual(aaravRecord.status, 'PRESENT');
    });
  });

  // ==========================================
  // SECTION 2: CBSE 9-POINT GRADING & RESULTS
  // ==========================================
  describe('CBSE 9-Point Grading Calculation & Result Publishing', () => {
    test('Admin schedules an Annual Examination', async () => {
      const res = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academicYearId: currentYear.id,
          name: `Annual Board Exam 2026 - ${Date.now().toString().slice(-4)}`,
          examType: 'FINAL',
          startDate: '2026-12-01',
          endDate: '2026-12-15',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      createdExamId = res.body.data.id;
    });

    test('Admin schedules Mathematics subject for the exam', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${createdExamId}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectId: mathSubject.id,
          examDate: '2026-12-05',
          startTime: '09:00',
          endTime: '12:00',
          maxMarks: 100,
          passMarks: 35,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      createdExamSubjectId = res.body.data.id;
    });

    test('Teacher enters 96% marks for Student Aarav (CBSE Grade A1)', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/subjects/${createdExamSubjectId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          marks: [
            {
              studentId: studentAarav.id,
              marksObtained: 96.0,
              isAbsent: false,
              remarks: 'Outstanding analytical skills',
            },
            ...(studentRohan
              ? [
                  {
                    studentId: studentRohan.id,
                    marksObtained: 84.0,
                    isAbsent: false,
                    remarks: 'Very good grasp of concepts',
                  },
                ]
              : []),
          ],
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    test('Admin publishes examination results with CBSE 9-Point grading model', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${createdExamId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ gradingModel: 'CBSE_9_POINT' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.gradingModel, 'CBSE_9_POINT');

      const aaravResult = res.body.data.results.find((r) => r.studentId === studentAarav.id);
      assert.ok(aaravResult);
      assert.strictEqual(aaravResult.grade, 'A1');
      assert.strictEqual(aaravResult.gpa, 10.0);
      assert.strictEqual(aaravResult.rank, 1);
    });
  });

  // ==========================================
  // SECTION 3: OFFICIAL BOARD REPORT CARD DOCUMENT
  // ==========================================
  describe('Official Board Report Card Generation & RBAC Isolation', () => {
    test('Admin generates official CBSE report card document for Aarav', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${createdExamId}/report-cards/${studentAarav.id}/official`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const doc = res.body.data;

      assert.strictEqual(doc.documentType, 'OFFICIAL_STUDENT_REPORT_CARD');
      assert.ok(doc.institution);
      assert.strictEqual(doc.institution.name, 'Greenwood International School');
      assert.ok(doc.student);
      assert.strictEqual(doc.student.admissionNumber, 'ADM-2025-001');
      assert.strictEqual(doc.scholasticPerformance.grade, 'A1');
      assert.strictEqual(doc.scholasticPerformance.resultStatus, 'PASSED');
      assert.strictEqual(doc.scholasticPerformance.promotionRemarks, 'Promoted to Next Academic Grade');
      assert.ok(Array.isArray(doc.coScholasticAssessment));
      assert.ok(Array.isArray(doc.gradingScaleLegend));
      assert.ok(doc.signatories.principal);
    });

    test('Student Aarav views his own official report card', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${createdExamId}/report-cards/${studentAarav.id}/official`)
        .set('Authorization', `Bearer ${studentToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.student.id, studentAarav.id);
    });

    test('Student Aarav CANNOT view Rohan\'s official report card (403 Forbidden)', async () => {
      if (!studentRohan) return;

      const res = await request(app)
        .get(`/api/v1/exams/${createdExamId}/report-cards/${studentRohan.id}/official`)
        .set('Authorization', `Bearer ${studentToken}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Access denied/i);
    });
  });
});
