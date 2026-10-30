const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
  const tables = [
    'classes', 'time_table', 'staff_salary_settings', 'payroll',
    'salary_payments', 'attendence', 'teacher_attendence', 'leaves',
    'fee_record', 'exams', 'buses', 'bus_root', 'bus_staff'
  ];
  for (const t of tables) {
    try {
      const [cols] = await conn.execute(`DESCRIBE \`_sms\`.\`${t}\``);
      console.log(`\n=== _sms.${t} ===`);
      console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
      const [rows] = await conn.execute(`SELECT * FROM \`_sms\`.\`${t}\` LIMIT 2`);
      console.log('Sample row:', rows[0] || 'empty');
    } catch (e) {
      console.log(`Table ${t} error:`, e.message);
    }
  }
  await conn.end();
}

main().catch(console.error);
