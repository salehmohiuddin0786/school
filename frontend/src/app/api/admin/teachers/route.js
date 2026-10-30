import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

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
        ON t.id = sss.staff_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (t.fname LIKE ? OR t.lname LIKE ? OR t.email LIKE ? OR t.subject LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY t.s_no DESC';
    const teachers = await query(sql, params);

    return NextResponse.json({ status: 'success', teachers });
  } catch (error) {
    console.error('Teachers GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    const teacherId = 'T' + Date.now().toString().slice(-9);
    const passwordHash = await hashPassword(password);

    await query(
      'INSERT INTO users (id, email, password_hash, role, theme) VALUES (?, ?, ?, ?, ?)',
      [teacherId, email, passwordHash, 'teacher', 'light']
    );

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

    // Insert salary settings
    await query(
      `INSERT INTO staff_salary_settings 
       (staff_id, staff_name, role, monthly_salary, basic_salary, allowances, deductions, effective_date, joining_date, employment_status)
       VALUES (?, ?, 'teacher', ?, ?, ?, ?, ?, ?, ?)`,
      [teacherId, staffName, monthly, bSalary, allow, deduct, effective_date || null, joining_date || null, employment_status]
    );

    // Track in salary history
    await query(
      `INSERT INTO staff_salary_history 
       (staff_id, staff_name, basic_salary, allowances, deductions, effective_date, joining_date, employment_status, updated_by, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Initial compensation setup', NOW())`,
      [teacherId, staffName, bSalary, allow, deduct, effective_date || null, joining_date || null, employment_status, session.id]
    );

    return NextResponse.json({ status: 'success', message: 'Teacher added successfully', id: teacherId });
  } catch (error) {
    console.error('Add teacher error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
