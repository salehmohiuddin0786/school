const mysql = require('mysql2/promise');

async function fixCollation() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: '_sms',
  });

  const [tables] = await conn.execute("SHOW TABLES FROM `_sms`");
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    try {
      await conn.execute(`ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`Converted ${tableName} to utf8mb4_unicode_ci`);
    } catch (e) {
      console.log(`Failed converting ${tableName}: ${e.message}`);
    }
  }

  await conn.end();
}

fixCollation().catch(console.error);
