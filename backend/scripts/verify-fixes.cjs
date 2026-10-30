const http = require('http');

async function testEndpoint(path, cookie) {
  return new Promise((resolve) => {
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        headers: {
          Cookie: cookie || '',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, body: data.slice(0, 200) });
        });
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

// We can test database queries directly as well:
const mysql = require('mysql2/promise');

async function testDb() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: '_sms' });
  console.log('Testing SQL joins in _sms:');

  // 1. Teachers join
  const [tRows] = await conn.execute(`
    SELECT t.id, t.fname, sss.basic_salary 
    FROM teachers t 
    LEFT JOIN staff_salary_settings sss ON t.id = sss.staff_id 
    LIMIT 2
  `);
  console.log('1. Teachers join SUCCESS:', tRows.length, 'rows');

  // 2. Staff attendance join
  const [saRows] = await conn.execute(`
    SELECT t.id, t.fname, COALESCE(ta.attendence, 'NOT_MARKED') as status
    FROM teachers t
    LEFT JOIN teacher_attendence ta ON t.id = ta.teacher_id AND ta.date = '2026-10-26'
    LIMIT 2
  `);
  console.log('2. Staff attendance join SUCCESS:', saRows.length, 'rows');

  // 3. Timetable join
  const [ttRows] = await conn.execute(`
    SELECT pt.id, pt.subject, t.fname
    FROM period_timetable pt
    LEFT JOIN teachers t ON pt.teacher_id = t.id
    LIMIT 2
  `);
  console.log('3. Timetable join SUCCESS:', ttRows.length, 'rows');

  // 4. Owner salaries join
  const [salRows] = await conn.execute(`
    SELECT t.id, t.fname, sss.monthly_salary
    FROM teachers t
    LEFT JOIN staff_salary_settings sss ON t.id = sss.staff_id
    LIMIT 2
  `);
  console.log('4. Owner salaries join SUCCESS:', salRows.length, 'rows');

  await conn.end();

  // 5. Test substitutions query in schoolnext_erp
  const erpConn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'schoolnext_erp' });
  const [subs] = await erpConn.execute(`
    SELECT 
      ts.id,
      ts.date,
      ts.status,
      te.startTime,
      te.endTime,
      sec.name as sectionName
    FROM schoolnext_erp.teachersubstitution ts
    JOIN schoolnext_erp.teacherprofile origTp ON ts.originalTeacherId = origTp.id
    JOIN schoolnext_erp.teacherprofile subTp ON ts.substituteTeacherId = subTp.id
    JOIN schoolnext_erp.timetableentry te ON ts.timetableEntryId = te.id
    JOIN schoolnext_erp.section sec ON te.sectionId = sec.id
    LIMIT 2
  `);
  console.log('5. Substitutions query SUCCESS:', subs.length, 'rows');
  await erpConn.end();
}

testDb().catch(console.error);
