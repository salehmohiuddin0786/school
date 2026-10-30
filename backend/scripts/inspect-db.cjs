const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
  const [dbs] = await conn.execute('SHOW DATABASES');
  console.log('Databases:', dbs.map(d => Object.values(d)[0]));

  for (const dbName of ['schoolnext_erp', '_sms']) {
    try {
      const [tables] = await conn.execute(`SHOW TABLES FROM \`${dbName}\``);
      console.log(`\n=== ${dbName} tables ===`);
      console.log(tables.map(t => Object.values(t)[0]).join(', '));
    } catch (e) {
      console.log(`Could not show tables for ${dbName}: ${e.message}`);
    }
  }

  // Inspect columns of interest in schoolnext_erp
  for (const tbl of ['teachersubstitution', 'staffattendance', 'notice', 'student', 'enrollment', 'teacherprofile', 'staffprofile', 'payrollperiod', 'payrollrecord']) {
    try {
      const [cols] = await conn.execute(`DESCRIBE \`schoolnext_erp\`.\`${tbl}\``);
      console.log(`\n--- schoolnext_erp.${tbl} columns ---`);
      console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
    } catch (e) {
      console.log(`Table ${tbl} error: ${e.message}`);
    }
  }

  // Inspect columns of interest in _sms
  for (const tbl of ['teachers', 'students', 'notice', 'leaves', 'attendence', 'teacher_attendence', 'fee_record', 'salary_payments', 'exams', 'marks', 'bus']) {
    try {
      const [cols] = await conn.execute(`DESCRIBE \`_sms\`.\`${tbl}\``);
      console.log(`\n--- _sms.${tbl} columns ---`);
      console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
    } catch (e) {
      console.log(`Table ${tbl} error: ${e.message}`);
    }
  }

  // Inspect bus tables
  for (const tbl of ['buses', 'bus_root', 'bus_staff']) {
    try {
      const [cols] = await conn.execute(`DESCRIBE \`_sms\`.\`${tbl}\``);
      console.log(`\n--- _sms.${tbl} columns ---`);
      console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
    } catch (e) {
      console.log(`_sms.${tbl} error: ${e.message}`);
    }
  }

  for (const tbl of ['transportroute', 'vehicle']) {
    try {
      const [cols] = await conn.execute(`DESCRIBE \`schoolnext_erp\`.\`${tbl}\``);
      console.log(`\n--- schoolnext_erp.${tbl} columns ---`);
      console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
    } catch (e) {
      console.log(`schoolnext_erp.${tbl} error: ${e.message}`);
    }
  }

  await conn.end();
}

main().catch(console.error);
