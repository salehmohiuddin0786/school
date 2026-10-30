const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
  const [t1] = await conn.query('SHOW TABLES FROM _sms');
  const [t2] = await conn.query('SHOW TABLES FROM schoolnext_erp');
  const erpTables = new Set(t2.map(r => Object.values(r)[0]));
  const missing = t1.map(r => Object.values(r)[0]).filter(t => !erpTables.has(t));

  for (const t of missing) {
    try {
      await conn.query('CREATE TABLE IF NOT EXISTS schoolnext_erp.' + t + ' LIKE _sms.' + t);
      await conn.query('INSERT IGNORE INTO schoolnext_erp.' + t + ' SELECT * FROM _sms.' + t);
      console.log('Successfully copied table:', t);
    } catch (e) {
      console.error('Error copying table ' + t + ':', e.message);
    }
  }

  // Also check notice table:
  const [erpNoticeCols] = await conn.query('DESCRIBE schoolnext_erp.notice');
  const erpCols = new Set(erpNoticeCols.map(c => c.Field));
  // In _sms notice has s_no, sender_id, editor_id, title, body, file, importance, timestamp, role, class
  // Add compatible columns to schoolnext_erp.notice if not present
  if (!erpCols.has('s_no')) {
    await conn.query('ALTER TABLE schoolnext_erp.notice ADD COLUMN s_no INT AUTO_INCREMENT PRIMARY KEY FIRST').catch(() => {});
  }
  if (!erpCols.has('body')) {
    await conn.query('ALTER TABLE schoolnext_erp.notice ADD COLUMN body TEXT NULL').catch(() => {});
  }
  if (!erpCols.has('importance')) {
    await conn.query('ALTER TABLE schoolnext_erp.notice ADD COLUMN importance VARCHAR(50) DEFAULT "normal"').catch(() => {});
  }
  if (!erpCols.has('timestamp')) {
    await conn.query('ALTER TABLE schoolnext_erp.notice ADD COLUMN timestamp VARCHAR(100) NULL').catch(() => {});
  }

  console.log('Database synchronization to schoolnext_erp complete!');
  await conn.end();
}

migrate().catch(console.error);
