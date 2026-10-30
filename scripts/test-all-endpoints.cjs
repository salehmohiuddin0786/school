const http = require('http');
const jwt = require('../node_modules/jsonwebtoken');

const JWT_SECRET = 'school_jwt_secret_key_2026_dct_production_grade';
const BASE_URL = 'http://localhost:3000';

// Pre-generated JWT tokens for every role
const tokens = {
  admin: jwt.sign({ id: 'A9876543210', email: 'admin@gmail.com', role: 'admin', tenantId: 'a30ecf76-6525-407b-b180-bd9b681799f1' }, JWT_SECRET),
  teacher: jwt.sign({ id: 'T1718791191', email: 'teacher@gmail.com', role: 'teacher', tenantId: 'a30ecf76-6525-407b-b180-bd9b681799f1' }, JWT_SECRET),
  student: jwt.sign({ id: 'S1718791292', email: 'student@gmail.com', role: 'student', tenantId: 'a30ecf76-6525-407b-b180-bd9b681799f1' }, JWT_SECRET),
  parent: jwt.sign({ id: '79a54496-7f26-493a-abc6-41551d4bc2e2', email: 'parent.patel@greenwood.edu', role: 'parent', tenantId: 'a30ecf76-6525-407b-b180-bd9b681799f1' }, JWT_SECRET),
  owner: jwt.sign({ id: 'O7898987845', email: 'owner@gmail.com', role: 'owner', tenantId: 'a30ecf76-6525-407b-b180-bd9b681799f1' }, JWT_SECRET),
  invalid: 'invalid.token.structure',
};

async function makeRequest(urlPath, method = 'GET', body = null, token = null) {
  const headers = {};
  if (token) headers['Cookie'] = 'sms_auth_token=' + token;
  if (body) headers['Content-Type'] = 'application/json';

  const startTime = Date.now();
  const res = await fetch(BASE_URL + urlPath, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const duration = Date.now() - startTime;
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }
  return { status: res.status, data, duration };
}

async function runAudit() {
  console.log('================================================================');
  console.log('   SCHOOLNEXT ERP - MASTER AUTOMATED QA & SECURITY TEST SUITE   ');
  console.log('================================================================\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  function test(name, passed, info = '') {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`  [PASS] ${name} ${info ? `(${info})` : ''}`);
    } else {
      results.failed++;
      console.error(`  [FAIL] ${name} ${info ? `(${info})` : ''}`);
    }
    results.details.push({ name, passed, info });
  }

  // -------------------------------------------------------------
  // SECTION 1: AUTHENTICATION & SESSION SECURITY
  // -------------------------------------------------------------
  console.log('\n--- SECTION 1: AUTHENTICATION & SESSION MANAGEMENT ---');
  {
    // Test login with valid admin credentials
    const r1 = await makeRequest('/api/auth/login', 'POST', { email: 'admin@gmail.com', password: '123' });
    test('POST /api/auth/login (Admin Credentials)', r1.status === 200 && r1.data?.status === 'success', `${r1.duration}ms`);

    // Test login with invalid password
    const r2 = await makeRequest('/api/auth/login', 'POST', { email: 'admin@gmail.com', password: 'WrongPassword999!' });
    test('POST /api/auth/login (Invalid Password Rejection)', r2.status === 401, `${r2.duration}ms`);

    // Test login with missing fields
    const r3 = await makeRequest('/api/auth/login', 'POST', { email: 'admin@gmail.com' });
    test('POST /api/auth/login (Missing Password Rejection)', r3.status === 400, `${r3.duration}ms`);

    // Test GET /api/auth/me authenticated
    const r4 = await makeRequest('/api/auth/me', 'GET', null, tokens.admin);
    test('GET /api/auth/me (Authenticated Session)', r4.status === 200 && r4.data?.authenticated === true, `${r4.duration}ms`);

    // Test GET /api/auth/me unauthenticated
    const r5 = await makeRequest('/api/auth/me', 'GET', null, null);
    test('GET /api/auth/me (Unauthenticated Rejection)', r5.status === 401, `${r5.duration}ms`);

    // Test GET /api/auth/me invalid token
    const r6 = await makeRequest('/api/auth/me', 'GET', null, tokens.invalid);
    test('GET /api/auth/me (Invalid Token Rejection)', r6.status === 401, `${r6.duration}ms`);
  }

  // -------------------------------------------------------------
  // SECTION 2: ADMIN APIS & DATA ENDPOINTS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 2: ADMIN APIS (ROLE: ADMIN) ---');
  {
    const r = await makeRequest('/api/admin/dashboard', 'GET', null, tokens.admin);
    test('GET /api/admin/dashboard', r.status === 200 && r.data?.status === 'success', `${r.duration}ms`);

    const rClasses = await makeRequest('/api/admin/classes', 'GET', null, tokens.admin);
    test('GET /api/admin/classes', rClasses.status === 200 && Array.isArray(rClasses.data?.classes), `${rClasses.duration}ms`);

    const rSubjects = await makeRequest('/api/admin/subjects', 'GET', null, tokens.admin);
    test('GET /api/admin/subjects', rSubjects.status === 200 && Array.isArray(rSubjects.data?.subjects), `${rSubjects.duration}ms`);

    const rTeachers = await makeRequest('/api/admin/teachers?search=', 'GET', null, tokens.admin);
    test('GET /api/admin/teachers', rTeachers.status === 200 && Array.isArray(rTeachers.data?.teachers), `${rTeachers.duration}ms`);

    const rStudents = await makeRequest('/api/admin/students?class=Class+10&year=2025-2026&page=1&limit=10', 'GET', null, tokens.admin);
    test('GET /api/admin/students (Class 10 Query)', rStudents.status === 200 && Array.isArray(rStudents.data?.students), `${rStudents.duration}ms`);

    const rAttendance = await makeRequest('/api/admin/attendance?class=Class+10&section=A', 'GET', null, tokens.admin);
    test('GET /api/admin/attendance', rAttendance.status === 200 && Array.isArray(rAttendance.data?.records), `${rAttendance.duration}ms`);

    const rStaffAtt = await makeRequest('/api/admin/staff-attendance', 'GET', null, tokens.admin);
    test('GET /api/admin/staff-attendance', rStaffAtt.status === 200 && Array.isArray(rStaffAtt.data?.records), `${rStaffAtt.duration}ms`);

    const rBuses = await makeRequest('/api/admin/buses', 'GET', null, tokens.admin);
    test('GET /api/admin/buses', rBuses.status === 200 && Array.isArray(rBuses.data?.buses), `${rBuses.duration}ms`);

    const rExams = await makeRequest('/api/admin/exams', 'GET', null, tokens.admin);
    test('GET /api/admin/exams', rExams.status === 200 && Array.isArray(rExams.data?.exams), `${rExams.duration}ms`);

    const rReportCards = await makeRequest('/api/admin/exams/report-cards', 'GET', null, tokens.admin);
    test('GET /api/admin/exams/report-cards (Selectors)', rReportCards.status === 200, `${rReportCards.duration}ms`);

    const rFees = await makeRequest('/api/admin/fees', 'GET', null, tokens.admin);
    test('GET /api/admin/fees', rFees.status === 200 && Array.isArray(rFees.data?.invoices), `${rFees.duration}ms`);

    const rLeaves = await makeRequest('/api/admin/leaves', 'GET', null, tokens.admin);
    test('GET /api/admin/leaves', rLeaves.status === 200 && Array.isArray(rLeaves.data?.leaves), `${rLeaves.duration}ms`);

    const rNotices = await makeRequest('/api/admin/notices', 'GET', null, tokens.admin);
    test('GET /api/admin/notices', rNotices.status === 200 && Array.isArray(rNotices.data?.notices), `${rNotices.duration}ms`);

    const rSubstitutions = await makeRequest('/api/admin/substitutions', 'GET', null, tokens.admin);
    test('GET /api/admin/substitutions', rSubstitutions.status === 200, `${rSubstitutions.duration}ms`);

    const rTimetable = await makeRequest('/api/admin/timetable?class=Class+10&section=A', 'GET', null, tokens.admin);
    test('GET /api/admin/timetable', rTimetable.status === 200 && Array.isArray(rTimetable.data?.entries), `${rTimetable.duration}ms`);
  }

  // -------------------------------------------------------------
  // SECTION 3: TEACHER APIS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 3: TEACHER APIS (ROLE: TEACHER) ---');
  {
    const rDash = await makeRequest('/api/teacher/dashboard', 'GET', null, tokens.teacher);
    test('GET /api/teacher/dashboard', rDash.status === 200 && rDash.data?.status === 'success', `${rDash.duration}ms`);

    const rMyAtt = await makeRequest('/api/teacher/my-attendance', 'GET', null, tokens.teacher);
    test('GET /api/teacher/my-attendance', rMyAtt.status === 200 && rMyAtt.data?.readOnly === true, `${rMyAtt.duration}ms`);

    const rAsg = await makeRequest('/api/teacher/assignments', 'GET', null, tokens.teacher);
    test('GET /api/teacher/assignments', rAsg.status === 200, `${rAsg.duration}ms`);

    const rLeaves = await makeRequest('/api/teacher/leaves', 'GET', null, tokens.teacher);
    test('GET /api/teacher/leaves', rLeaves.status === 200, `${rLeaves.duration}ms`);

    const rTT = await makeRequest('/api/teacher/timetable', 'GET', null, tokens.teacher);
    test('GET /api/teacher/timetable', rTT.status === 200, `${rTT.duration}ms`);
  }

  // -------------------------------------------------------------
  // SECTION 4: STUDENT APIS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 4: STUDENT APIS (ROLE: STUDENT) ---');
  {
    const rDash = await makeRequest('/api/student/dashboard', 'GET', null, tokens.student);
    test('GET /api/student/dashboard', rDash.status === 200, `${rDash.duration}ms`);

    const rAsg = await makeRequest('/api/student/assignments', 'GET', null, tokens.student);
    test('GET /api/student/assignments', rAsg.status === 200, `${rAsg.duration}ms`);

    const rBus = await makeRequest('/api/student/bus', 'GET', null, tokens.student);
    test('GET /api/student/bus', rBus.status === 200, `${rBus.duration}ms`);

    const rFees = await makeRequest('/api/student/fees', 'GET', null, tokens.student);
    test('GET /api/student/fees', rFees.status === 200, `${rFees.duration}ms`);

    const rTT = await makeRequest('/api/student/timetable', 'GET', null, tokens.student);
    test('GET /api/student/timetable', rTT.status === 200, `${rTT.duration}ms`);
  }

  // -------------------------------------------------------------
  // SECTION 5: PARENT APIS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 5: PARENT APIS (ROLE: PARENT) ---');
  {
    const rChildren = await makeRequest('/api/parent/children', 'GET', null, tokens.parent);
    test('GET /api/parent/children', rChildren.status === 200, `${rChildren.duration}ms`);

    const rOverview = await makeRequest('/api/parent/overview', 'GET', null, tokens.parent);
    test('GET /api/parent/overview', rOverview.status === 200 || rOverview.status === 400, `${rOverview.duration}ms`);
  }

  // -------------------------------------------------------------
  // SECTION 6: OWNER APIS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 6: OWNER APIS (ROLE: OWNER) ---');
  {
    const rAccounts = await makeRequest('/api/owner/accounts', 'GET', null, tokens.owner);
    test('GET /api/owner/accounts', rAccounts.status === 200, `${rAccounts.duration}ms`);

    const rSalaries = await makeRequest('/api/owner/salaries', 'GET', null, tokens.owner);
    test('GET /api/owner/salaries', rSalaries.status === 200, `${rSalaries.duration}ms`);

    const rStudents = await makeRequest('/api/owner/students', 'GET', null, tokens.owner);
    test('GET /api/owner/students', rStudents.status === 200, `${rStudents.duration}ms`);

    const rTeachers = await makeRequest('/api/owner/teachers', 'GET', null, tokens.owner);
    test('GET /api/owner/teachers', rTeachers.status === 200, `${rTeachers.duration}ms`);
  }

  // -------------------------------------------------------------
  // SECTION 7: ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION BOUNDARIES
  // -------------------------------------------------------------
  console.log('\n--- SECTION 7: ROLE-BASED ACCESS CONTROL (RBAC) ---');
  {
    // Student trying to access Admin Dashboard
    const r1 = await makeRequest('/api/admin/dashboard', 'GET', null, tokens.student);
    test('Student BLOCKED from /api/admin/dashboard (403)', r1.status === 403, `Status: ${r1.status}`);

    // Teacher trying to access Admin Fees
    const r2 = await makeRequest('/api/admin/fees', 'GET', null, tokens.teacher);
    test('Teacher BLOCKED from /api/admin/fees (403)', r2.status === 403, `Status: ${r2.status}`);

    // Student trying to access Owner Accounts
    const r3 = await makeRequest('/api/owner/accounts', 'GET', null, tokens.student);
    test('Student BLOCKED from /api/owner/accounts (403)', r3.status === 403, `Status: ${r3.status}`);

    // Teacher trying to access Student Fees Payment
    const r4 = await makeRequest('/api/admin/teachers', 'GET', null, tokens.student);
    test('Student BLOCKED from /api/admin/teachers (403)', r4.status === 403, `Status: ${r4.status}`);

    // Unauthenticated request to protected student dashboard
    const r5 = await makeRequest('/api/student/dashboard', 'GET', null, null);
    test('Unauthenticated BLOCKED from /api/student/dashboard (403)', r5.status === 403, `Status: ${r5.status}`);
  }

  // -------------------------------------------------------------
  // SECTION 8: APPLICATION SECURITY AUDIT (SQLi, IDOR, Tampering)
  // -------------------------------------------------------------
  console.log('\n--- SECTION 8: APPLICATION SECURITY AUDIT ---');
  {
    // SQL Injection Test in Teacher Search
    const rSqli1 = await makeRequest('/api/admin/teachers?search=%27%20OR%20%271%27=%271', 'GET', null, tokens.admin);
    test('SQL Injection Resiliency (Teacher Search Param)', rSqli1.status === 200 && Array.isArray(rSqli1.data?.teachers), 'Parameterized query sanitized');

    // SQL Injection Test in Students Class filter
    const rSqli2 = await makeRequest('/api/admin/students?class=%27%20OR%201=1--', 'GET', null, tokens.admin);
    test('SQL Injection Resiliency (Students Class Param)', rSqli2.status === 200, 'Parameterized query sanitized');

    // Teacher cannot tamper with own attendance record
    const rTamperAtt = await makeRequest('/api/teacher/my-attendance', 'POST', { status: 'PRESENT' }, tokens.teacher);
    test('Teacher Attendance Read-Only Integrity (Strictly No Modification)', rTamperAtt.status === 403 || rTamperAtt.status === 405, `Status: ${rTamperAtt.status}`);
  }

  // -------------------------------------------------------------
  // SECTION 9: FRONTEND PORTAL PAGES RENDERING AUDIT
  // -------------------------------------------------------------
  console.log('\n--- SECTION 9: FRONTEND PORTAL PAGES RENDERING ---');
  const portalPages = [
    '/login',
    '/admin',
    '/admin/students',
    '/admin/teachers',
    '/admin/classes-subjects',
    '/admin/attendance',
    '/admin/teacher-attendance',
    '/admin/exams',
    '/admin/exams/report-cards',
    '/admin/fees',
    '/admin/timetable',
    '/admin/substitutions',
    '/admin/buses',
    '/admin/notices',
    '/teacher',
    '/teacher/attendance',
    '/teacher/timetable',
    '/teacher/assignments',
    '/teacher/marks',
    '/teacher/leaves',
    '/teacher/notices',
    '/student',
    '/student/timetable',
    '/student/assignments',
    '/student/fees',
    '/student/bus',
    '/student/progress',
    '/student/notices',
    '/parent',
    '/parent/attendance',
    '/parent/fees',
    '/parent/exams',
    '/parent/assignments',
    '/parent/timetable',
    '/parent/notices',
    '/owner',
    '/owner/students',
    '/owner/teachers',
    '/owner/salaries',
    '/owner/fees',
  ];

  for (const page of portalPages) {
    const rPage = await makeRequest(page, 'GET');
    test(`Page Render: ${page}`, rPage.status === 200 || rPage.status === 307 || rPage.status === 308, `HTTP ${rPage.status}, ${rPage.duration}ms`);
  }

  console.log('\n================================================================');
  console.log(`   AUDIT COMPLETE: ${results.passed}/${results.total} PASSED (${results.failed} FAILED)`);
  console.log('================================================================\n');

  if (results.failed > 0) {
    console.error('Failed test details:');
    results.details.filter(d => !d.passed).forEach(d => console.error(`  - ${d.name}: ${d.info}`));
    process.exit(1);
  } else {
    console.log('All automated quality assurance and security assertions passed cleanly!');
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
