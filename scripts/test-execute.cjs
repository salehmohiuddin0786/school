const mysql = require('mysql2/promise');

async function testExecute() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'schoolnext_erp',
    waitForConnections: true,
    connectionLimit: 10,
  });

  console.log('1. Testing Teachers with p.execute:');
  try {
    const search = '';
    let sql = `
      SELECT 
        t.s_no, 
        t.id, 
        t.fname, 
        t.lname, 
        t.father, 
        t.subject, 
        t.gender, 
        t.dob, 
        t.image, 
        t.phone, 
        t.email, 
        t.address, 
        t.city, 
        t.state, 
        t.class, 
        t.section,
        COALESCE(sss.basic_salary, 25000) as basic_salary,
        COALESCE(sss.allowances, 10000) as allowances,
        COALESCE(sss.deductions, 2000) as deductions,
        COALESCE(sss.monthly_salary, 35000) as monthly_salary,
        sss.effective_date,
        sss.joining_date,
        COALESCE(sss.employment_status, 'ACTIVE') as employment_status
      FROM teachers t
      LEFT JOIN staff_salary_settings sss 
        ON t.id = sss.staff_id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      sql += ' AND (t.fname LIKE ? OR t.lname LIKE ? OR t.email LIKE ? OR t.subject LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    sql += ' ORDER BY t.s_no DESC';

    const [rows] = await pool.execute(sql, params);
    console.log('Teachers SUCCESS, rows:', rows.length);
  } catch (e) {
    console.error('Teachers execute ERROR:', e);
  }

  console.log('2. Testing Attendance with p.execute:');
  try {
    const date = '2026-10-30';
    const className = '10';
    const section = 'A';
    let sql = `
      SELECT 
        s.id as student_id,
        s.fname,
        s.lname,
        s.class,
        s.section,
        COALESCE(a.attendence, '0') as status,
        a.date as attendance_date
      FROM students s
      LEFT JOIN attendence a 
        ON s.id = a.student_id 
        AND DATE(a.date) = ?
      WHERE 1=1
    `;
    const params = [date];
    if (className) {
      sql += ' AND s.class = ?';
      params.push(className);
    }
    if (section) {
      sql += ' AND s.section = ?';
      params.push(section);
    }
    sql += ' ORDER BY s.fname ASC';

    const [rows] = await pool.execute(sql, params);
    console.log('Attendance SUCCESS, rows:', rows.length);
  } catch (e) {
    console.error('Attendance execute ERROR:', e);
  }

  console.log('3. Testing Staff Attendance with p.execute:');
  try {
    const date = '2026-10-30';
    const sql = `
      SELECT 
        t.id as teacher_id,
        t.fname,
        t.lname,
        t.subject,
        t.email,
        t.phone,
        COALESCE(ta.attendence, 'NOT_MARKED') as status,
        ta.remarks,
        ta.updated_at
      FROM teachers t
      LEFT JOIN teacher_attendence ta 
        ON t.id = ta.teacher_id
        AND ta.date = ?
      ORDER BY t.fname ASC
    `;
    const [rows] = await pool.execute(sql, [date]);
    console.log('Staff Attendance SUCCESS, rows:', rows.length);
  } catch (e) {
    console.error('Staff Attendance execute ERROR:', e);
  }

  console.log('4. Testing Subjects with p.execute:');
  try {
    const sql = 'SELECT s_no, subject_id, subject_name, class FROM subjects WHERE 1=1 ORDER BY s_no DESC';
    const [rows] = await pool.execute(sql, []);
    console.log('Subjects SUCCESS, rows:', rows.length);
  } catch (e) {
    console.error('Subjects execute ERROR:', e);
  }

  console.log('5. Testing Exams with p.execute:');
  try {
    const sql = 'SELECT * FROM exams WHERE 1=1 ORDER BY exam_date ASC, start_time ASC, s_no DESC';
    const [rows] = await pool.execute(sql, []);
    console.log('Exams SUCCESS, rows:', rows.length);
  } catch (e) {
    console.error('Exams execute ERROR:', e);
  }

  await pool.end();
}

testExecute().catch(console.error);
