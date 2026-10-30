const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
  for (const tbl of ['classroom', 'section', 'course', 'subject', 'timetableentry']) {
    const [cols] = await conn.execute(`DESCRIBE \`schoolnext_erp\`.\`${tbl}\``);
    console.log(`\n=== schoolnext_erp.${tbl} ===`);
    console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
  }
  await conn.end();
}

main().catch(console.error);
