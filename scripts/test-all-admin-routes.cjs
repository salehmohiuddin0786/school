const mysql = require('mysql2/promise');

async function testAllAdminRoutes() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'schoolnext_erp',
    waitForConnections: true,
    connectionLimit: 10,
  });

  const tests = [
    {
      name: '1. /api/admin/attendance',
      query: `
        SELECT s.id as student_id, s.fname, s.lname, s.class, s.section,
               COALESCE(a.attendence, '0') as status, a.date as attendance_date
        FROM students s
        LEFT JOIN attendence a ON s.id = a.student_id AND DATE(a.date) = ?
        WHERE s.class = ? AND s.section = ?
        ORDER BY s.fname ASC
      `,
      params: ['2026-10-30', '10', 'A'],
    },
    {
      name: '2. /api/admin/buses',
      query: `SELECT * FROM buses ORDER BY s_no DESC`,
      params: [],
    },
    {
      name: '3. /api/admin/classes',
      query: `SELECT s_no, class, section, fees FROM classes ORDER BY class ASC, section ASC`,
      params: [],
    },
    {
      name: '4. /api/admin/exams',
      query: `SELECT * FROM exams WHERE 1=1 ORDER BY exam_date ASC, start_time ASC, s_no DESC`,
      params: [],
    },
    {
      name: '5. /api/admin/fees (legacy fallback query)',
      query: `
        SELECT f.s_no, f.id as studentId, f.month, f.total, f.paid, f.balance, f.timestamp,
               s.fname, s.lname, s.roll_no, s.class, s.section, s.phone
        FROM fee_record f
        JOIN students s ON f.id = s.id
        ORDER BY f.s_no DESC LIMIT 40
      `,
      params: [],
    },
    {
      name: '6. /api/admin/leaves',
      query: `
        SELECT l.s_no, l.sender_id, t.fname, t.lname, t.email, l.leave_type, l.leave_desc,
               l.start_date, l.end_date, l.leave_days, l.status, l.send_date
        FROM leaves l
        LEFT JOIN teachers t ON CONVERT(l.sender_id USING utf8mb4) = CONVERT(t.id USING utf8mb4)
        ORDER BY l.s_no DESC
      `,
      params: [],
    },
    {
      name: '7. /api/admin/notices',
      query: `SELECT * FROM notice ORDER BY s_no DESC`,
      params: [],
    },
    {
      name: '8. /api/admin/staff-attendance',
      query: `
        SELECT t.id as teacher_id, t.fname, t.lname, t.subject, t.email, t.phone,
               COALESCE(ta.attendence, 'NOT_MARKED') as status, ta.remarks, ta.updated_at
        FROM teachers t
        LEFT JOIN teacher_attendence ta ON t.id = ta.teacher_id AND ta.date = ?
        ORDER BY t.fname ASC
      `,
      params: ['2026-10-30'],
    },
    {
      name: '9. /api/admin/students',
      query: `SELECT * FROM students ORDER BY s_no DESC LIMIT 10`,
      params: [],
    },
    {
      name: '10. /api/admin/subjects',
      query: `SELECT s_no, subject_id, subject_name, class FROM subjects ORDER BY s_no DESC`,
      params: [],
    },
    {
      name: '11. /api/admin/teachers',
      query: `
        SELECT t.s_no, t.id, t.fname, t.lname, t.father, t.subject, t.gender, t.dob,
               t.image, t.phone, t.email, t.address, t.city, t.state, t.class, t.section,
               COALESCE(sss.basic_salary, 25000) as basic_salary,
               COALESCE(sss.allowances, 10000) as allowances,
               COALESCE(sss.deductions, 2000) as deductions,
               COALESCE(sss.monthly_salary, 35000) as monthly_salary,
               sss.effective_date, sss.joining_date,
               COALESCE(sss.employment_status, 'ACTIVE') as employment_status
        FROM teachers t
        LEFT JOIN staff_salary_settings sss ON t.id = sss.staff_id
        WHERE 1=1 ORDER BY t.s_no DESC
      `,
      params: [],
    },
    {
      name: '12. /api/admin/timetable',
      query: `
        SELECT pt.id, pt.class, pt.section, pt.weekday, pt.period_number, pt.period_name,
               pt.start_time, pt.end_time, pt.subject, pt.teacher_id, pt.classroom, pt.is_break,
               t.fname as teacher_fname, t.lname as teacher_lname
        FROM period_timetable pt
        LEFT JOIN teachers t ON pt.teacher_id = t.id
        WHERE 1=1
      `,
      params: [],
    },
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      const [rows] = await pool.execute(t.query, t.params);
      console.log(`[PASS] ${t.name} (${rows.length} rows)`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${t.name} -> ERROR:`, err.message);
    }
  }

  console.log(`\nResults: ${passed} / ${tests.length} route queries passed.`);
  await pool.end();
}

testAllAdminRoutes().catch(console.error);
