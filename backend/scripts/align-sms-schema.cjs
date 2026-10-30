const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'schoolnext_erp',
  });

  console.log('Connected to schoolnext_erp database for schema alignment.');

  // Helper to safely add column if not exists
  const addColumnIfNotExists = async (table, colDef) => {
    const colName = colDef.split(' ')[0].replace(/[`"]/g, '');
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [process.env.DB_NAME || 'schoolnext_erp', table, colName]
    );
    if (cols.length === 0) {
      await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN ${colDef}`);
      console.log(`Added column ${colName} to ${table}`);
    }
  };

  // 1. Classes table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`classes\` (
      \`s_no\` int NOT NULL AUTO_INCREMENT,
      \`class\` varchar(20) NOT NULL,
      \`section\` varchar(10) NOT NULL DEFAULT 'A',
      \`fees\` int NOT NULL DEFAULT 0,
      PRIMARY KEY (\`s_no\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Ensure default classes exist
  const [existingClasses] = await conn.execute('SELECT COUNT(*) as count FROM `classes`');
  if (existingClasses[0].count === 0) {
    const defaultClasses = [
      ['10', 'A', 25000],
      ['10', 'B', 25000],
      ['11', 'A', 30000],
      ['11', 'B', 30000],
      ['12', 'A', 35000],
      ['12', 'B', 35000],
      ['12c', 'A', 35000],
    ];
    for (const [c, s, f] of defaultClasses) {
      await conn.execute('INSERT INTO `classes` (`class`, `section`, `fees`) VALUES (?, ?, ?)', [c, s, f]);
    }
    console.log('Populated default classes in `classes` table.');
  }

  // 2. Students table additions
  await addColumnIfNotExists('students', '`bus_id` VARCHAR(20) NULL');
  await addColumnIfNotExists('students', '`roll_no` VARCHAR(20) NULL');
  await addColumnIfNotExists('students', '`academic_year` VARCHAR(20) DEFAULT "2025-2026"');

  // 3. Teacher attendance table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`teacher_attendence\` (
      \`s_no\` int NOT NULL AUTO_INCREMENT,
      \`teacher_id\` varchar(40) NOT NULL,
      \`attendence\` varchar(20) NOT NULL DEFAULT 'PRESENT',
      \`date\` date NOT NULL,
      \`source\` varchar(20) DEFAULT 'admin',
      \`leave_id\` int DEFAULT NULL,
      \`marked_by\` varchar(40) DEFAULT NULL,
      \`remarks\` varchar(255) DEFAULT NULL,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`s_no\`),
      UNIQUE KEY \`uniq_teacher_date\` (\`teacher_id\`, \`date\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await addColumnIfNotExists('teacher_attendence', '`remarks` VARCHAR(255) NULL');

  // 4. Staff salary settings & salary history
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`staff_salary_settings\` (
      \`s_no\` int NOT NULL AUTO_INCREMENT,
      \`staff_id\` varchar(40) NOT NULL,
      \`staff_name\` varchar(120) NOT NULL,
      \`role\` varchar(40) NOT NULL DEFAULT 'teacher',
      \`monthly_salary\` int NOT NULL DEFAULT 35000,
      \`basic_salary\` int NOT NULL DEFAULT 25000,
      \`allowances\` int NOT NULL DEFAULT 10000,
      \`deductions\` int NOT NULL DEFAULT 2000,
      \`effective_date\` date DEFAULT NULL,
      \`joining_date\` date DEFAULT NULL,
      \`employment_status\` varchar(50) DEFAULT 'ACTIVE',
      PRIMARY KEY (\`s_no\`),
      UNIQUE KEY \`uniq_staff\` (\`staff_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await addColumnIfNotExists('staff_salary_settings', '`basic_salary` INT NOT NULL DEFAULT 25000');
  await addColumnIfNotExists('staff_salary_settings', '`allowances` INT NOT NULL DEFAULT 10000');
  await addColumnIfNotExists('staff_salary_settings', '`deductions` INT NOT NULL DEFAULT 2000');
  await addColumnIfNotExists('staff_salary_settings', '`effective_date` DATE NULL');
  await addColumnIfNotExists('staff_salary_settings', '`joining_date` DATE NULL');
  await addColumnIfNotExists('staff_salary_settings', '`employment_status` VARCHAR(50) DEFAULT "ACTIVE"');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`staff_salary_history\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`staff_id\` varchar(40) NOT NULL,
      \`staff_name\` varchar(120) DEFAULT NULL,
      \`basic_salary\` int NOT NULL,
      \`allowances\` int NOT NULL DEFAULT 0,
      \`deductions\` int NOT NULL DEFAULT 0,
      \`effective_date\` date DEFAULT NULL,
      \`joining_date\` date DEFAULT NULL,
      \`employment_status\` varchar(50) DEFAULT 'ACTIVE',
      \`updated_by\` varchar(40) DEFAULT NULL,
      \`remarks\` varchar(255) DEFAULT NULL,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Salary payments (attendance-based payroll records)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`salary_payments\` (
      \`s_no\` int NOT NULL AUTO_INCREMENT,
      \`staff_id\` varchar(40) NOT NULL,
      \`staff_name\` varchar(120) NOT NULL,
      \`role\` varchar(40) NOT NULL DEFAULT 'teacher',
      \`monthly_salary\` int NOT NULL DEFAULT 0,
      \`basic_salary\` int NOT NULL DEFAULT 0,
      \`allowances\` int NOT NULL DEFAULT 0,
      \`deductions\` int NOT NULL DEFAULT 0,
      \`working_days\` int NOT NULL DEFAULT 30,
      \`attendance_days\` int NOT NULL DEFAULT 0,
      \`leave_days\` int NOT NULL DEFAULT 0,
      \`approved_leave_days\` int NOT NULL DEFAULT 0,
      \`leave_balance\` int NOT NULL DEFAULT 0,
      \`lop_days\` decimal(8,2) NOT NULL DEFAULT 0,
      \`total_deduction\` decimal(12,2) NOT NULL DEFAULT 0,
      \`net_payable\` decimal(12,2) NOT NULL DEFAULT 0,
      \`salary_month\` date NOT NULL,
      \`status\` varchar(20) NOT NULL DEFAULT 'DRAFT',
      \`payment_date\` date DEFAULT NULL,
      \`payment_method\` varchar(50) DEFAULT 'BANK_TRANSFER',
      \`remarks\` varchar(255) DEFAULT NULL,
      \`amount\` decimal(12,2) NOT NULL DEFAULT 0,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`s_no\`),
      UNIQUE KEY \`uniq_staff_month\` (\`staff_id\`, \`salary_month\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await addColumnIfNotExists('salary_payments', '`basic_salary` INT NOT NULL DEFAULT 0');
  await addColumnIfNotExists('salary_payments', '`payment_method` VARCHAR(50) DEFAULT "BANK_TRANSFER"');
  await addColumnIfNotExists('salary_payments', '`remarks` VARCHAR(255) NULL');

  // 6. Exams table additions
  await addColumnIfNotExists('exams', '`exam_date` DATE NULL');
  await addColumnIfNotExists('exams', '`start_time` VARCHAR(20) NULL');
  await addColumnIfNotExists('exams', '`end_time` VARCHAR(20) NULL');
  await addColumnIfNotExists('exams', '`room` VARCHAR(50) NULL');
  await addColumnIfNotExists('exams', '`is_published` TINYINT(1) DEFAULT 1');

  // 7. Daily period timetable table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`period_timetable\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`class\` varchar(50) NOT NULL,
      \`section\` varchar(10) NOT NULL DEFAULT 'A',
      \`weekday\` enum('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY') NOT NULL,
      \`period_number\` int NOT NULL DEFAULT 1,
      \`period_name\` varchar(50) NOT NULL DEFAULT 'Period 1',
      \`start_time\` varchar(20) NOT NULL,
      \`end_time\` varchar(20) NOT NULL,
      \`subject\` varchar(100) NOT NULL,
      \`teacher_id\` varchar(40) DEFAULT NULL,
      \`classroom\` varchar(50) DEFAULT NULL,
      \`is_break\` tinyint(1) NOT NULL DEFAULT 0,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_slot\` (\`class\`, \`section\`, \`weekday\`, \`period_number\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 8. Fee payments & receipts table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`fee_payments\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`receipt_no\` varchar(40) NOT NULL,
      \`student_id\` varchar(40) NOT NULL,
      \`fee_record_id\` int DEFAULT NULL,
      \`amount_paid\` decimal(12,2) NOT NULL,
      \`payment_type\` enum('INSTALLMENT','FULL_BALANCE') NOT NULL DEFAULT 'INSTALLMENT',
      \`payment_method\` varchar(50) NOT NULL DEFAULT 'ONLINE',
      \`transaction_ref\` varchar(100) DEFAULT NULL,
      \`previous_balance\` decimal(12,2) NOT NULL,
      \`remaining_balance\` decimal(12,2) NOT NULL,
      \`payment_date\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_receipt\` (\`receipt_no\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 9. Assign demo bus to existing student if not set
  const [buses] = await conn.execute('SELECT bus_id FROM `buses` LIMIT 1');
  if (buses.length > 0) {
    const defaultBusId = buses[0].bus_id;
    await conn.execute('UPDATE `students` SET `bus_id` = ? WHERE `bus_id` IS NULL OR `bus_id` = ""', [defaultBusId]);
    console.log(`Associated default bus ${defaultBusId} with active student(s) for verification.`);
  }

  // 10. Ensure demo teacher has default salary settings
  const [teachers] = await conn.execute('SELECT id, fname, lname FROM `teachers`');
  for (const t of teachers) {
    await conn.execute(`
      INSERT INTO \`staff_salary_settings\` (\`staff_id\`, \`staff_name\`, \`role\`, \`monthly_salary\`, \`basic_salary\`, \`allowances\`, \`deductions\`, \`employment_status\`, \`effective_date\`)
      VALUES (?, ?, 'teacher', 45000, 30000, 15000, 2000, 'ACTIVE', CURDATE())
      ON DUPLICATE KEY UPDATE \`staff_name\` = VALUES(\`staff_name\`);
    `, [t.id, `${t.fname} ${t.lname || ''}`.trim()]);
  }

  // 11. Ensure sample fee record exists for student if empty
  const [feeRows] = await conn.execute('SELECT COUNT(*) as cnt FROM `fee_record`');
  if (feeRows[0].cnt === 0) {
    const [students] = await conn.execute('SELECT id FROM `students` LIMIT 1');
    if (students.length > 0) {
      await conn.execute(`
        INSERT INTO \`fee_record\` (\`id\`, \`month\`, \`other_collection\`, \`total\`, \`paid\`, \`balance\`, \`timestamp\`)
        VALUES (?, 'October 2026', 5000, 35000, 15000, 20000, NOW());
      `, [students[0].id]);
      console.log('Created sample fee record for student:', students[0].id);
    }
  }

  console.log('Schema alignment and seed verification completed successfully.');
  await conn.end();
}

migrate().catch(console.error);
