import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();

    const combinedTeachers = [];

    // 1. Query legacy `teachers` table + `staff_salary_settings`
    try {
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
          ON CONVERT(t.id USING utf8mb4) = CONVERT(sss.staff_id USING utf8mb4)
        WHERE 1=1
      `;
      const params = [];

      if (search) {
        sql += ' AND (t.fname LIKE ? OR t.lname LIKE ? OR t.email LIKE ? OR t.subject LIKE ? OR t.id LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s, s);
      }

      sql += ' ORDER BY t.s_no DESC';
      const legacyTeachers = await query(sql, params);
      if (Array.isArray(legacyTeachers)) {
        combinedTeachers.push(...legacyTeachers);
      }
    } catch (legacyErr) {
      console.warn('Legacy teachers query fallback:', legacyErr.message);
    }

    // 2. Query canonical multi-tenant `teacherprofile` + `user`
    try {
      let erpSql = `
        SELECT 
          tp.id as s_no,
          tp.id,
          tp.employeeCode,
          u.firstName as fname,
          u.lastName as lname,
          '' as father,
          COALESCE(tp.specialization, 'General') as subject,
          'Male' as gender,
          '' as dob,
          COALESCE(u.avatarUrl, '1701517055user.png') as image,
          COALESCE(u.phone, '') as phone,
          u.email,
          '' as address,
          '' as city,
          '' as state,
          '' as class,
          '' as section,
          45000 as basic_salary,
          15000 as allowances,
          2000 as deductions,
          58000 as monthly_salary,
          tp.joiningDate as effective_date,
          tp.joiningDate as joining_date,
          'ACTIVE' as employment_status
        FROM teacherprofile tp
        JOIN user u ON tp.userId = u.id
        WHERE 1=1
      `;
      const erpParams = [];

      if (search) {
        erpSql += ' AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ? OR tp.specialization LIKE ? OR tp.employeeCode LIKE ?)';
        const s = `%${search}%`;
        erpParams.push(s, s, s, s, s);
      }

      erpSql += ' ORDER BY u.firstName ASC';
      const erpTeachers = await query(erpSql, erpParams);

      if (Array.isArray(erpTeachers)) {
        const existingEmails = new Set(
          combinedTeachers.map(t => (t.email || t.id || '').toLowerCase().trim())
        );

        for (const et of erpTeachers) {
          const key = (et.email || et.id || '').toLowerCase().trim();
          if (!existingEmails.has(key)) {
            existingEmails.add(key);
            combinedTeachers.push(et);
          }
        }
      }
    } catch (erpErr) {
      console.warn('Canonical teacherprofile query fallback:', erpErr.message);
    }

    return NextResponse.json({ status: 'success', teachers: combinedTeachers });
  } catch (error) {
    console.error('Teachers GET error:', error);
    return NextResponse.json({ status: 'error', error: error.message, teachers: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      fname,
      lname,
      father,
      subject,
      gender,
      className,
      section,
      dob,
      phone,
      email,
      address,
      city,
      zip,
      state,
      password = '123',
      // Salary & Employment fields
      basic_salary = 25000,
      allowances = 10000,
      deductions = 2000,
      effective_date = new Date().toISOString().split('T')[0],
      joining_date = new Date().toISOString().split('T')[0],
      employment_status = 'ACTIVE',
    } = body;

    if (!fname || !email || !subject) {
      return NextResponse.json({ error: 'First name, email and subject are required' }, { status: 400 });
    }

    const existingLegacy = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingLegacy) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    const teacherId = 'T' + Date.now().toString().slice(-9);
    const passwordHash = await hashPassword(password);

    // 1. Insert into legacy users table
    await query(
      'INSERT INTO users (id, email, password_hash, role, theme) VALUES (?, ?, ?, ?, ?)',
      [teacherId, email, passwordHash, 'teacher', 'light']
    );

    // 2. Insert into legacy teachers table
    await query(
      `INSERT INTO teachers 
       (id, fname, lname, father, subject, gender, dob, image, phone, email, address, city, zip, state, class, section) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        teacherId,
        fname,
        lname || '',
        father || '',
        subject,
        gender || 'Male',
        dob || '',
        '1701517055user.png',
        phone || '',
        email,
        address || '',
        city || '',
        zip || '',
        state || '',
        className || '',
        section || '',
      ]
    );

    const bSalary = parseInt(basic_salary, 10) || 0;
    const allow = parseInt(allowances, 10) || 0;
    const deduct = parseInt(deductions, 10) || 0;
    const monthly = bSalary + allow - deduct;
    const staffName = `${fname} ${lname || ''}`.trim();

    // 3. Insert salary settings
    await query(
      `INSERT INTO staff_salary_settings 
       (staff_id, staff_name, role, monthly_salary, basic_salary, allowances, deductions, effective_date, joining_date, employment_status)
       VALUES (?, ?, 'teacher', ?, ?, ?, ?, ?, ?, ?)`,
      [teacherId, staffName, monthly, bSalary, allow, deduct, effective_date || null, joining_date || null, employment_status]
    );

    // 4. Track in salary history
    await query(
      `INSERT INTO staff_salary_history 
       (staff_id, staff_name, basic_salary, allowances, deductions, effective_date, joining_date, employment_status, updated_by, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Initial compensation setup', NOW())`,
      [teacherId, staffName, bSalary, allow, deduct, effective_date || null, joining_date || null, employment_status, session.id || 'admin']
    );

    // 5. Canonical ERP dual-write synchronization (best effort)
    try {
      const canonicalUserExists = await queryOne('SELECT id FROM user WHERE email = ?', [email]);
      if (!canonicalUserExists) {
        const canonicalUserId = crypto.randomUUID();
        const tenantId = session.tenantId || 'schoolnext-default';
        await query(
          `INSERT INTO user (id, tenantId, email, passwordHash, role, firstName, lastName, phone, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'TEACHER', ?, ?, ?, 'ACTIVE', NOW(), NOW())`,
          [canonicalUserId, tenantId, email, passwordHash, fname, lname || '', phone || '']
        );

        const profileId = crypto.randomUUID();
        await query(
          `INSERT INTO teacherprofile (id, tenantId, userId, employeeCode, specialization, joiningDate, designation, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, 'Faculty', NOW(), NOW())`,
          [profileId, tenantId, canonicalUserId, teacherId, subject, joining_date || new Date()]
        );
      }
    } catch (canonicalSyncErr) {
      console.warn('Canonical dual-write sync warning:', canonicalSyncErr.message);
    }

    return NextResponse.json({ status: 'success', message: 'Teacher added successfully', id: teacherId });
  } catch (error) {
    console.error('Add teacher error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
