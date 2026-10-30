const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
  
  const [cols] = await conn.execute('DESCRIBE `schoolnext_erp`.`timetableentry`');
  console.log('timetableentry columns:', cols.map(c => c.Field));

  const [tcols] = await conn.execute('SHOW FULL COLUMNS FROM `_sms`.`teachers`');
  console.log('teachers columns collation:', tcols.map(c => `${c.Field} (${c.Collation})`));

  const [tables] = await conn.execute("SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = '_sms'");
  console.log('tables collation in _sms:', tables);

  await conn.end();
}

main().catch(console.error);
