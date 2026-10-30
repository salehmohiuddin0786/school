const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'schoolnext_erp',
  });

  console.log('--- Testing Teachers ---');
  try {
    const [teachers] = await conn.query(`
      SELECT 
        t.s_no, t.id, t.fname, t.lname, t.father, t.subject, t.gender, t.dob, 
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
    `);
    console.log('Teachers OK, count:', teachers.length);
  } catch (e) {
    console.error('Teachers FAILED:', e.message);
  }

  console.log('--- Testing Attendance ---');
  try {
    const [attendance] = await conn.query(`
      SELECT s.s_no, s.id, s.fname, s.lname, s.class, s.section, a.attendence as status
      FROM students s
      LEFT JOIN attendence a ON s.id = a.student_id AND a.date = ?
      WHERE s.class = ? AND s.section = ?
    `, ['2026-10-30', '10', 'A']);
    console.log('Attendance OK, count:', attendance.length);
  } catch (e) {
    console.error('Attendance FAILED:', e.message);
  }

  console.log('--- Testing Staff Attendance ---');
  try {
    const [staffAtt] = await conn.query(`
      SELECT t.s_no, t.id, t.fname, t.lname, t.subject, t.phone, ta.attendence as status
      FROM teachers t
      LEFT JOIN teacher_attendence ta ON t.id = ta.teacher_id AND ta.date = ?
    `, ['2026-10-30']);
    console.log('Staff Attendance OK, count:', staffAtt.length);
  } catch (e) {
    console.error('Staff Attendance FAILED:', e.message);
  }

  console.log('--- Testing Subjects ---');
  try {
    const [subjects] = await conn.query(`
      SELECT s_no, class, section, subject FROM subjects ORDER BY class ASC, section ASC, subject ASC
    `);
    console.log('Subjects OK, count:', subjects.length);
  } catch (e) {
    console.error('Subjects FAILED:', e.message);
  }

  console.log('--- Testing Exams ---');
  try {
    const [exams] = await conn.query(`
      SELECT * FROM exams ORDER BY s_no DESC
    `);
    console.log('Exams OK, count:', exams.length);
  } catch (e) {
    console.error('Exams FAILED:', e.message);
  }

  await conn.end();
}

test().catch(console.error);
