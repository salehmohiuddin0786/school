const mysql = require('mysql2/promise');

async function fixNotice() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'schoolnext_erp',
  });

  const [cols] = await conn.query('DESCRIBE notice');
  const existing = new Set(cols.map(c => c.Field));

  const toAdd = [
    ['s_no', 'INT AUTO_INCREMENT UNIQUE KEY'],
    ['sender_id', 'VARCHAR(100) NULL'],
    ['editor_id', 'VARCHAR(100) NULL'],
    ['file', 'VARCHAR(255) NULL'],
    ['role', 'VARCHAR(50) NULL'],
    ['class', 'VARCHAR(50) NULL'],
  ];

  for (const [col, def] of toAdd) {
    if (!existing.has(col)) {
      try {
        await conn.query('ALTER TABLE notice ADD COLUMN ' + col + ' ' + def);
        console.log('Added column', col);
      } catch (e) {
        console.error('Error adding', col, ':', e.message);
      }
    }
  }

  try {
    const [smsNotices] = await conn.query('SELECT * FROM _sms.notice');
    console.log('_sms notices count:', smsNotices.length);
    for (const n of smsNotices) {
      await conn.query(
        `INSERT IGNORE INTO notice 
         (id, tenantId, title, content, targetAudience, isUrgent, publishedById, createdAt, updatedAt, body, importance, timestamp, s_no, sender_id, editor_id, file, role, class) 
         VALUES (UUID(), 'a30ecf76-6525-407b-b180-bd9b681799f1', ?, ?, 'ALL', ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          n.title,
          n.body,
          n.importance === 'high' ? 1 : 0,
          n.sender_id,
          n.body,
          n.importance,
          n.timestamp,
          n.s_no,
          n.sender_id,
          n.editor_id,
          n.file,
          n.role,
          n.class,
        ]
      );
    }
    console.log('Synchronized notices from _sms');
  } catch (e) {
    console.error('Error copying notices:', e.message);
  }

  await conn.end();
}

fixNotice().catch(console.error);
