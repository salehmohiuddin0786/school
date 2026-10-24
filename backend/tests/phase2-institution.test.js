import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';
import { hashPassword } from '../src/utils/crypto.js';

describe('Phase 2 — Institution Management Integration Tests', () => {
  let app;
  let adminToken;
  let teacherToken;
  let studentToken;
  let parentToken;
  let demoTenant;
  let secondTenant;

  const testSuffix = Date.now().toString().slice(-4);
  const campusCode = `CMP${testSuffix}`;
  const yearCode = `20${testSuffix}-20${Number(testSuffix) + 1}`;
  const courseCode = `C${testSuffix}`;
  const subjectCode = `S${testSuffix}`;
  const admissionNo = `ADM-TEST-${testSuffix}`;
  const studentEmail = `student.test.${testSuffix}@greenwood.edu`;
  const parentEmail = `parent.test.${testSuffix}@greenwood.edu`;
  const teacherCode = `TCH${testSuffix}`;
  const teacherEmail = `teacher.test.${testSuffix}@greenwood.edu`;

  let createdCampusId;
  let createdCourseId;
  let createdSectionId;
  let createdSubjectId;
  let createdStudentId;

  before(async () => {
    await connectDatabase();
    app = createApp();

    demoTenant = await prisma.tenant.findUnique({ where: { code: 'GWIS' } });
    secondTenant = await prisma.tenant.findUnique({ where: { code: 'STXAV' } });

    // Ensure tokens for standard accounts
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
  });

  after(async () => {
    // Teardown created test entities
    try {
      if (createdStudentId) {
        await prisma.enrollment.deleteMany({ where: { studentId: createdStudentId } });
        await prisma.studentParent.deleteMany({ where: { studentId: createdStudentId } });
        const st = await prisma.student.findUnique({ where: { id: createdStudentId } });
        if (st) {
          await prisma.student.delete({ where: { id: createdStudentId } });
          await prisma.user.delete({ where: { id: st.userId } });
        }
      }
      if (createdSectionId) {
        await prisma.classSubject.deleteMany({ where: { sectionId: createdSectionId } });
        await prisma.section.delete({ where: { id: createdSectionId } });
      }
      if (createdSubjectId) {
        await prisma.subject.delete({ where: { id: createdSubjectId } });
      }
      if (createdCourseId) {
        await prisma.course.delete({ where: { id: createdCourseId } });
      }
      if (createdCampusId) {
        await prisma.campus.delete({ where: { id: createdCampusId } });
      }
      const createdTeacher = await prisma.teacherProfile.findFirst({ where: { employeeCode: teacherCode } });
      if (createdTeacher) {
        await prisma.teacherProfile.delete({ where: { id: createdTeacher.id } });
        await prisma.user.delete({ where: { id: createdTeacher.userId } });
      }
      const createdParent = await prisma.user.findUnique({ where: { email: parentEmail } });
      if (createdParent) {
        await prisma.parentProfile.deleteMany({ where: { userId: createdParent.id } });
        await prisma.user.delete({ where: { id: createdParent.id } });
      }
    } catch (e) {
      // Ignore cleanup error
    }

    await disconnectDatabase();
  });

  // -----------------------------------------------------------
  // 1. CAMPUS MANAGEMENT
  // -----------------------------------------------------------
  test('POST /api/v1/campuses creates a new campus within active tenant', async () => {
    const res = await request(app)
      .post('/api/v1/campuses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: campusCode,
        name: `Campus ${testSuffix}`,
        address: '88, Sarjapur Road, Bengaluru',
        phone: '+91 80 2999 8888',
        email: `campus.${testSuffix}@greenwood.edu`,
        isMain: false,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.code, campusCode);
    assert.strictEqual(res.body.data.tenantId, demoTenant.id);
    createdCampusId = res.body.data.id;
  });

  test('POST /api/v1/campuses rejects duplicate campus code in same tenant', async () => {
    const res = await request(app)
      .post('/api/v1/campuses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: campusCode,
        name: `Duplicate Campus ${testSuffix}`,
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('already exists'));
  });

  test('GET /api/v1/campuses lists all campuses in the tenant', async () => {
    const res = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((c) => c.code === 'MAIN'));
  });

  // -----------------------------------------------------------
  // 2. ACADEMICS (YEARS, COURSES, SECTIONS, SUBJECTS)
  // -----------------------------------------------------------
  test('POST /api/v1/academics/academic-years creates a new academic year and set-current toggles cleanly', async () => {
    const createRes = await request(app)
      .post('/api/v1/academics/academic-years')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: yearCode,
        name: `Academic Year ${yearCode}`,
        startDate: '2026-06-01',
        endDate: '2027-05-31',
        isCurrent: false,
      });

    assert.strictEqual(createRes.status, 201);
    const yearId = createRes.body.data.id;

    // Toggle to current
    const setRes = await request(app)
      .patch(`/api/v1/academics/academic-years/${yearId}/set-current`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(setRes.status, 200);
    assert.strictEqual(setRes.body.data.isCurrent, true);

    // Revert original year back to current
    const oldYear = await prisma.academicYear.findUnique({
      where: { tenantId_code: { tenantId: demoTenant.id, code: '2025-2026' } },
    });
    await request(app)
      .patch(`/api/v1/academics/academic-years/${oldYear.id}/set-current`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  test('POST /api/v1/academics/courses creates a new class course', async () => {
    const res = await request(app)
      .post('/api/v1/academics/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: courseCode,
        name: `Course ${courseCode}`,
        description: 'Class 11 Science Stream',
        durationYears: 1,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.code, courseCode);
    createdCourseId = res.body.data.id;
  });

  test('POST /api/v1/academics/sections creates a section under the course', async () => {
    const currentYear = await prisma.academicYear.findFirst({
      where: { tenantId: demoTenant.id, isCurrent: true },
    });

    const res = await request(app)
      .post('/api/v1/academics/sections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        courseId: createdCourseId,
        academicYearId: currentYear.id,
        name: `Section A-${testSuffix}`,
        capacity: 35,
      });

    assert.strictEqual(res.status, 201);
    createdSectionId = res.body.data.id;
  });

  test('POST /api/v1/academics/subjects and class-subjects links curriculum', async () => {
    const subRes = await request(app)
      .post('/api/v1/academics/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: subjectCode,
        name: `Subject ${subjectCode}`,
        creditHours: 4.5,
        isElective: false,
      });

    assert.strictEqual(subRes.status, 201);
    createdSubjectId = subRes.body.data.id;

    // Link subject to section
    const linkRes = await request(app)
      .post('/api/v1/academics/class-subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sectionId: createdSectionId,
        subjectId: createdSubjectId,
      });

    assert.strictEqual(linkRes.status, 201);
    assert.strictEqual(linkRes.body.data.sectionId, createdSectionId);
    assert.strictEqual(linkRes.body.data.subjectId, createdSubjectId);
  });

  // -----------------------------------------------------------
  // 3. STUDENT ADMISSION & PROFILES
  // -----------------------------------------------------------
  test('POST /api/v1/students/admit registers student and creates enrollment atomically', async () => {
    const currentYear = await prisma.academicYear.findFirst({
      where: { tenantId: demoTenant.id, isCurrent: true },
    });

    const res = await request(app)
      .post('/api/v1/students/admit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Rohan',
        lastName: `Verma${testSuffix}`,
        email: studentEmail,
        password: 'Student@Rohan2026!',
        admissionNumber: admissionNo,
        dateOfBirth: '2010-08-20',
        gender: 'MALE',
        bloodGroup: 'B+',
        emergencyContact: '+91 98765 11111',
        sectionId: createdSectionId,
        academicYearId: currentYear.id,
        rollNumber: '1101',
        parent: {
          firstName: 'Anil',
          lastName: `Verma${testSuffix}`,
          email: parentEmail,
          phone: '+91 98765 22222',
          relationship: 'FATHER',
          occupation: 'Civil Engineer',
        },
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.student.admissionNumber, admissionNo);
    assert.strictEqual(res.body.data.enrollment.rollNumber, '1101');
    assert.ok(res.body.data.parent);

    createdStudentId = res.body.data.student.id;
  });

  test('POST /api/v1/students/admit rejects duplicate admission number in same tenant', async () => {
    const res = await request(app)
      .post('/api/v1/students/admit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Clone',
        lastName: 'Student',
        email: `clone.${testSuffix}@greenwood.edu`,
        admissionNumber: admissionNo, // duplicate
        dateOfBirth: '2010-01-01',
        gender: 'FEMALE',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('already assigned'));
  });

  test('GET /api/v1/students searches and paginates student records', async () => {
    const res = await request(app)
      .get(`/api/v1/students?search=${admissionNo}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.some((s) => s.admissionNumber === admissionNo));
  });

  test('Student authorization: Student can view own profile, but CANNOT view another student', async () => {
    const aaravProfile = await prisma.student.findFirst({
      where: { admissionNumber: 'ADM-2025-001' },
    });

    // 1. Aarav viewing his own profile -> 200 OK
    const selfRes = await request(app)
      .get(`/api/v1/students/${aaravProfile.id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(selfRes.status, 200);
    assert.strictEqual(selfRes.body.data.admissionNumber, 'ADM-2025-001');

    // 2. Aarav trying to view Rohan's profile -> 403 Forbidden
    const otherRes = await request(app)
      .get(`/api/v1/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(otherRes.status, 403);
    assert.strictEqual(otherRes.body.success, false);
  });

  // -----------------------------------------------------------
  // 4. PARENTS & VERIFIED STUDENT-PARENT RELATIONS
  // -----------------------------------------------------------
  test('Parent authorization: Parent can view own linked child, but CANNOT view unlinked student', async () => {
    const aaravProfile = await prisma.student.findFirst({
      where: { admissionNumber: 'ADM-2025-001' },
    });

    // 1. Vikram Patel viewing his linked child Aarav -> 200 OK
    const myChildRes = await request(app)
      .get(`/api/v1/students/${aaravProfile.id}`)
      .set('Authorization', `Bearer ${parentToken}`);

    assert.strictEqual(myChildRes.status, 200);
    assert.strictEqual(myChildRes.body.data.admissionNumber, 'ADM-2025-001');

    // 2. Vikram Patel trying to view Rohan Verma (unrelated) -> 403 Forbidden
    const unrelatedRes = await request(app)
      .get(`/api/v1/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    assert.strictEqual(unrelatedRes.status, 403);
    assert.strictEqual(unrelatedRes.body.success, false);
    assert.ok(unrelatedRes.body.message.includes('verified linked children'));
  });

  test('GET /api/v1/parents/my-children returns verified children for logged in parent', async () => {
    const res = await request(app)
      .get('/api/v1/parents/my-children')
      .set('Authorization', `Bearer ${parentToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((c) => c.student.admissionNumber === 'ADM-2025-001'));
  });

  // -----------------------------------------------------------
  // 5. TEACHERS & FACULTY PROFILES
  // -----------------------------------------------------------
  test('POST /api/v1/teachers registers teacher with employee code and role', async () => {
    const res = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Kavita',
        lastName: `Rao${testSuffix}`,
        email: teacherEmail,
        password: 'Teacher@Kavita2026!',
        employeeCode: teacherCode,
        designation: 'Physics Faculty',
        specialization: 'Quantum Mechanics & Optics',
        qualification: 'M.Sc. Physics',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.employeeCode, teacherCode);
    assert.strictEqual(res.body.data.tenantId, demoTenant.id);
  });

  test('POST /api/v1/teachers rejects duplicate employee code in same tenant', async () => {
    const res = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Code',
        email: `dup.${testSuffix}@greenwood.edu`,
        employeeCode: teacherCode,
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('already exists'));
  });

  test('GET /api/v1/teachers/my-profile returns authenticated faculty profile with schedule', async () => {
    const res = await request(app)
      .get('/api/v1/teachers/my-profile')
      .set('Authorization', `Bearer ${teacherToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.employeeCode, 'EMP-T-101');
    assert.ok(Array.isArray(res.body.data.teacherAssignments));
  });

  // -----------------------------------------------------------
  // 6. MULTI-TENANT ISOLATION ON ACADEMIC & STUDENT DATA
  // -----------------------------------------------------------
  test('Cross-tenant isolation: Tenant B CANNOT see Greenwood students or classes', async () => {
    // 1. Ensure Tenant B has admin user with SCHOOL_ADMIN role and students.read permission
    const bAdminPassword = 'Admin@StXaviers2026!';
    const bPwdHash = await hashPassword(bAdminPassword);

    const bAdminUser = await prisma.user.upsert({
      where: { email: 'admin@stxaviers.edu' },
      update: { passwordHash: bPwdHash, status: 'ACTIVE' },
      create: {
        tenantId: secondTenant.id,
        email: 'admin@stxaviers.edu',
        passwordHash: bPwdHash,
        firstName: 'Father',
        lastName: 'Francis',
        status: 'ACTIVE',
      },
    });

    let bRole = await prisma.role.findFirst({
      where: { tenantId: secondTenant.id, code: 'SCHOOL_ADMIN' },
    });
    if (!bRole) {
      bRole = await prisma.role.create({
        data: { tenantId: secondTenant.id, code: 'SCHOOL_ADMIN', name: 'School Admin' },
      });
    }

    const studentsReadPerm = await prisma.permission.findUnique({
      where: { code: 'students.read' },
    });
    if (studentsReadPerm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: bRole.id, permissionId: studentsReadPerm.id } },
        update: {},
        create: { roleId: bRole.id, permissionId: studentsReadPerm.id },
      });
    }

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: bAdminUser.id, roleId: bRole.id } },
      update: {},
      create: { userId: bAdminUser.id, roleId: bRole.id, tenantId: secondTenant.id },
    });

    const bLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@stxaviers.edu', password: bAdminPassword });

    assert.strictEqual(bLogin.status, 200);
    const bAdminToken = bLogin.body.data.tokens.accessToken;

    // Tenant B queries /api/v1/students -> Must NOT see Greenwood's students
    const bStudentsRes = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${bAdminToken}`);

    assert.strictEqual(bStudentsRes.status, 200);
    assert.strictEqual(bStudentsRes.body.data.length, 0); // 0 students in Tenant B

    // Tenant B attempts direct ID lookup of Greenwood student -> 404 Not Found
    const directRes = await request(app)
      .get(`/api/v1/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${bAdminToken}`);

    assert.strictEqual(directRes.status, 404);
  });
});
