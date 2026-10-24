import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

describe('Phase 4 — Examinations and LMS Integration Tests', () => {
  let app;
  let adminToken;
  let teacherToken;
  let studentToken;
  let parentToken;
  let tenantBAdminToken;
  let demoTenant;
  let tenantB;

  let testTeacher;
  let testStudent;
  let testSection;
  let testSubject;
  let testClassSubject;
  let currentYear;

  let createdExamId;
  let createdExamSubjectId;
  let createdGradeScaleId;
  let createdAssignmentId;
  let createdSubmissionId;
  let createdMaterialId;

  before(async () => {
    await connectDatabase();
    app = createApp();

    demoTenant = await prisma.tenant.findUnique({ where: { code: 'GWIS' } });
    currentYear = await prisma.academicYear.findFirst({
      where: { tenantId: demoTenant.id, isCurrent: true },
    });

    // 1. Get tokens for Greenwood International
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

    // 2. Setup Tenant B for multi-tenant isolation testing
    tenantB = await prisma.tenant.upsert({
      where: { code: 'SPRING-COL' },
      update: {},
      create: {
        code: 'SPRING-COL',
        name: 'Springfield College',
        type: 'COLLEGE',
        website: 'https://springfield.edu',
        email: 'admin@springfield.edu',
        phone: '+919999900002',
        address: '456 Campus Road',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '411001',
      },
    });

    let adminRoleB = await prisma.role.findFirst({
      where: { tenantId: tenantB.id, code: 'COLLEGE_ADMIN' },
    });
    if (!adminRoleB) {
      adminRoleB = await prisma.role.create({
        data: {
          tenantId: tenantB.id,
          name: 'College Administrator',
          code: 'COLLEGE_ADMIN',
          isSystem: false,
        },
      });
    }

    // Attach permissions to Tenant B admin role
    const examReadPerm = await prisma.permission.findUnique({ where: { code: 'exams.read' } });
    if (examReadPerm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: adminRoleB.id, permissionId: examReadPerm.id },
        },
        update: {},
        create: { roleId: adminRoleB.id, permissionId: examReadPerm.id },
      });
    }

    const passwordHash = await bcrypt.hash('College@Springfield2026!', 10);
    const userB = await prisma.user.upsert({
      where: { email: 'admin@springfield.edu' },
      update: { passwordHash },
      create: {
        tenantId: tenantB.id,
        email: 'admin@springfield.edu',
        passwordHash,
        firstName: 'Springfield',
        lastName: 'Admin',
        status: 'ACTIVE',
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: userB.id, roleId: adminRoleB.id } },
      update: {},
      create: { userId: userB.id, roleId: adminRoleB.id, tenantId: tenantB.id },
    });

    const tenantBLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@springfield.edu', password: 'College@Springfield2026!' });
    tenantBAdminToken = tenantBLogin.body.data.tokens.accessToken;

    // 3. Fetch fixtures
    testTeacher = await prisma.teacherProfile.findFirst({
      where: { tenantId: demoTenant.id, employeeCode: 'EMP-T-101' },
    });
    testStudent = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id, admissionNumber: 'ADM-2025-001' },
    });
    testSubject = await prisma.subject.findFirst({
      where: { tenantId: demoTenant.id, code: 'MATH-10' },
    });
    testClassSubject = await prisma.classSubject.findFirst({
      where: { tenantId: demoTenant.id, subjectId: testSubject.id },
      include: { section: true },
    });
    testSection = testClassSubject.section;
  });

  after(async () => {
    try {
      if (createdSubmissionId) {
        await prisma.assignmentSubmission.deleteMany({ where: { id: createdSubmissionId } });
      }
      if (createdAssignmentId) {
        await prisma.assignment.deleteMany({ where: { id: createdAssignmentId } });
      }
      if (createdMaterialId) {
        await prisma.learningMaterial.deleteMany({ where: { id: createdMaterialId } });
      }
      if (createdExamId) {
        await prisma.reportCard.deleteMany({ where: { examId: createdExamId } });
        await prisma.markEntry.deleteMany({ where: { examSubjectId: createdExamSubjectId } });
        await prisma.examSubject.deleteMany({ where: { examId: createdExamId } });
        await prisma.exam.deleteMany({ where: { id: createdExamId } });
      }
      if (createdGradeScaleId) {
        await prisma.gradeScale.deleteMany({ where: { id: createdGradeScaleId } });
      }
    } catch (err) {
      // Ignore cleanup error
    }
    await disconnectDatabase();
  });

  // ==========================================
  // SECTION 1: GRADE SCALES
  // ==========================================
  describe('Grade Scales Management', () => {
    test('Admin creates a grade scale rule (A+: 90-100%)', async () => {
      const res = await request(app)
        .post('/api/v1/exams/grade-scales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Distinction Grade A+',
          minPercentage: 90.0,
          maxPercentage: 100.0,
          gradeLetter: 'A+',
          gradePoint: 10.0,
          remarks: 'Outstanding performance',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.gradeLetter, 'A+');
      createdGradeScaleId = res.body.data.id;
    });

    test('Staff lists active grade scales', async () => {
      const res = await request(app)
        .get('/api/v1/exams/grade-scales')
        .set('Authorization', `Bearer ${teacherToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 1);
    });
  });

  // ==========================================
  // SECTION 2: EXAMS & SUBJECT SCHEDULING
  // ==========================================
  describe('Exam Lifecycle & Subject Scheduling', () => {
    test('Admin schedules Midterm Examination', async () => {
      const res = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academicYearId: currentYear.id,
          name: 'Midterm Board Assessment 2026',
          examType: 'MIDTERM',
          startDate: '2026-11-10',
          endDate: '2026-11-20',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.name, 'Midterm Board Assessment 2026');
      assert.strictEqual(res.body.data.publishStatus, 'DRAFT');
      createdExamId = res.body.data.id;
    });

    test('Admin lists examinations filtered by academic year', async () => {
      const res = await request(app)
        .get(`/api/v1/exams?academicYearId=${currentYear.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const found = res.body.data.some((e) => e.id === createdExamId);
      assert.ok(found);
    });

    test('Admin schedules Mathematics subject paper with max marks 100', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${createdExamId}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectId: testSubject.id,
          examDate: '2026-11-12',
          startTime: '09:00',
          endTime: '12:00',
          maxMarks: 100.0,
          passMarks: 35.0,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.subjectId, testSubject.id);
      createdExamSubjectId = res.body.data.id;
    });

    test('Rejects duplicate scheduling of the same subject in the exam', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${createdExamId}/subjects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectId: testSubject.id,
          examDate: '2026-11-14',
          maxMarks: 100.0,
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('already scheduled'));
    });
  });

  // ==========================================
  // SECTION 3: MARKS ENTRY & VALIDATION
  // ==========================================
  describe('Marks Entry & Validation Engine', () => {
    test('Rejects marks entry if marksObtained exceeds maxMarks (105 > 100)', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/subjects/${createdExamSubjectId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          marks: [
            {
              studentId: testStudent.id,
              marksObtained: 105.0,
              isAbsent: false,
            },
          ],
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('exceeds maximum allowable marks'));
    });

    test('Teacher enters valid marks for student Aarav (94/100)', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/subjects/${createdExamSubjectId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          marks: [
            {
              studentId: testStudent.id,
              marksObtained: 94.0,
              isAbsent: false,
              remarks: 'Excellent problem solving skills',
            },
          ],
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(Number(res.body.data[0].marksObtained), 94.0);
    });

    test('Teacher retrieves marks sheet for the examination subject', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/subjects/${createdExamSubjectId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.id, createdExamSubjectId);
      assert.ok(res.body.data.markEntries.length >= 1);
    });
  });

  // ==========================================
  // SECTION 4: RESULTS PUBLICATION & REPORT CARDS
  // ==========================================
  describe('Results Publication, GPA & Report Cards', () => {
    test('Admin publishes examination results with GPA and ranking', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${createdExamId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.results.length >= 1);

      const aaravResult = res.body.data.results.find((r) => r.studentId === testStudent.id);
      assert.ok(aaravResult);
      assert.strictEqual(aaravResult.percentage, 94.0);
      assert.strictEqual(aaravResult.grade, 'A+');
      assert.strictEqual(aaravResult.gpa, 10.0);
      assert.strictEqual(aaravResult.rank, 1);
    });

    test('Prevents modification of marks once results are published', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/subjects/${createdExamSubjectId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          marks: [{ studentId: testStudent.id, marksObtained: 90.0 }],
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('already been published'));
    });

    test('Student Aarav views their own official report card', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${createdExamId}/report-cards/${testStudent.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.studentId, testStudent.id);
      assert.strictEqual(res.body.data.grade, 'A+');
      assert.strictEqual(Number(res.body.data.totalMarks), 94.0);
    });

    test('Parent Patel views linked child Aarav report card', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${createdExamId}/report-cards/${testStudent.id}`)
        .set('Authorization', `Bearer ${parentToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.studentId, testStudent.id);
      assert.strictEqual(res.body.data.rank, 1);
    });
  });

  // ==========================================
  // SECTION 5: ASSIGNMENTS & LMS
  // ==========================================
  describe('Assignments & LMS Workflows', () => {
    test('Teacher creates a homework assignment with max marks 20', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classSubjectId: testClassSubject.id,
          teacherProfileId: testTeacher.id,
          title: 'Quadratic Equations Worksheet 1',
          description: 'Solve questions 1 through 15 from chapter 4 exercises.',
          dueDate: '2026-11-25',
          maxMarks: 20.0,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Quadratic Equations Worksheet 1');
      assert.strictEqual(Number(res.body.data.maxMarks), 20.0);
      createdAssignmentId = res.body.data.id;
    });

    test('Student Aarav lists available assignments', async () => {
      const res = await request(app)
        .get('/api/v1/assignments')
        .set('Authorization', `Bearer ${studentToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      const found = res.body.data.some((a) => a.id === createdAssignmentId);
      assert.ok(found);
    });

    test('Student Aarav submits completed assignment', async () => {
      const res = await request(app)
        .post(`/api/v1/assignments/${createdAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          submissionText: 'Completed questions 1 to 15. The roots for #7 are x=2 and x=5.',
          fileUrl: 'https://storage.schoolnext.com/submissions/aarav-math-ch4.pdf',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.studentId, testStudent.id);
      assert.strictEqual(res.body.data.status, 'SUBMITTED');
      createdSubmissionId = res.body.data.id;
    });

    test('Teacher views submissions for the assignment', async () => {
      const res = await request(app)
        .get(`/api/v1/assignments/${createdAssignmentId}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.length >= 1);
      assert.strictEqual(res.body.data[0].id, createdSubmissionId);
    });

    test('Teacher grades submission (19/20) with constructive feedback', async () => {
      const res = await request(app)
        .patch(`/api/v1/assignments/submissions/${createdSubmissionId}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          marksAwarded: 19.0,
          feedback: 'Outstanding step-by-step working! Slight algebraic simplification error on #12.',
          status: 'GRADED',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(Number(res.body.data.marksAwarded), 19.0);
      assert.strictEqual(res.body.data.status, 'GRADED');
    });

    test('Rejects assignment grading exceeding maximum marks (25 > 20)', async () => {
      const res = await request(app)
        .patch(`/api/v1/assignments/submissions/${createdSubmissionId}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          marksAwarded: 25.0,
          feedback: 'Too generous',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('cannot exceed maximum allowed marks'));
    });
  });

  // ==========================================
  // SECTION 6: LEARNING MATERIALS
  // ==========================================
  describe('Learning Materials Publication', () => {
    test('Teacher uploads study material (PDF syllabus notes)', async () => {
      const res = await request(app)
        .post('/api/v1/assignments/materials')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classSubjectId: testClassSubject.id,
          teacherProfileId: testTeacher.id,
          title: 'Class 10 Mathematics - Formula Sheet & Key Concepts',
          description: 'Comprehensive formula sheet for Algebra and Coordinate Geometry.',
          fileUrl: 'https://storage.schoolnext.com/materials/math-10-formula-sheet.pdf',
          fileType: 'PDF',
          isPublished: true,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Class 10 Mathematics - Formula Sheet & Key Concepts');
      createdMaterialId = res.body.data.id;
    });

    test('Student Aarav views published learning materials', async () => {
      const res = await request(app)
        .get(`/api/v1/assignments/materials?classSubjectId=${testClassSubject.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.length >= 1);
      const found = res.body.data.some((m) => m.id === createdMaterialId);
      assert.ok(found);
    });
  });

  // ==========================================
  // SECTION 7: MULTI-TENANT ISOLATION
  // ==========================================
  describe('Multi-Tenant Data Isolation (Phase 4)', () => {
    test('Tenant B cannot access Tenant A examination details', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${createdExamId}`)
        .set('Authorization', `Bearer ${tenantBAdminToken}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    test('Tenant B cannot view Tenant A assignment submissions', async () => {
      const res = await request(app)
        .get(`/api/v1/assignments/${createdAssignmentId}/submissions`)
        .set('Authorization', `Bearer ${tenantBAdminToken}`);

      // Tenant B admin has no assignments.manage or will get 403 or 404
      assert.ok([403, 404].includes(res.status));
      assert.strictEqual(res.body.success, false);
    });
  });
});
