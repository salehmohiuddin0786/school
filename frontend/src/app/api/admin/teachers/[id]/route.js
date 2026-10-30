import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const teacher = await queryOne(
      `SELECT 
        t.s_no, t.id, t.fname, t.lname, t.father, t.subject, t.gender,
        t.dob, t.phone, t.email, t.address, t.city, t.state, t.class, t.section,
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
      WHERE t.id = ?`,
      [id]
    );

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Fetch salary history
    const history = await query(
      `SELECT id, basic_salary, allowances, deductions, effective_date, joining_date, employment_status, updated_by, remarks, created_at
       FROM staff_salary_history
       WHERE staff_id = ?
       ORDER BY id DESC`,
      [id]
    );

    return NextResponse.json({ status: 'success', teacher, history });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
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
      address,
      city,
      state,
      basic_salary,
      allowances,
      deductions,
      effective_date,
      joining_date,
      employment_status,
      remarks = 'Compensation revision',
    } = body;

    const teacher = await queryOne('SELECT * FROM teachers WHERE id = ?', [id]);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Update teacher info
    await query(
      `UPDATE teachers SET 
        fname = COALESCE(?, fname),
        lname = COALESCE(?, lname),
        father = COALESCE(?, father),
        subject = COALESCE(?, subject),
        gender = COALESCE(?, gender),
        class = COALESCE(?, class),
        section = COALESCE(?, section),
        dob = COALESCE(?, dob),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state)
      WHERE id = ?`,
      [fname, lname, father, subject, gender, className, section, dob, phone, address, city, state, id]
    );

    // If salary fields are provided, update salary settings and log history
    if (basic_salary !== undefined || allowances !== undefined || deductions !== undefined || employment_status !== undefined) {
      const bSalary = parseInt(basic_salary, 10) || 0;
      const allow = parseInt(allowances, 10) || 0;
      const deduct = parseInt(deductions, 10) || 0;
      const monthly = bSalary + allow - deduct;
      const staffName = `${fname || teacher.fname} ${lname || teacher.lname || ''}`.trim();

      await query(
        `INSERT INTO staff_salary_settings 
         (staff_id, staff_name, role, monthly_salary, basic_salary, allowances, deductions, effective_date, joining_date, employment_status)
         VALUES (?, ?, 'teacher', ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           staff_name = VALUES(staff_name),
           monthly_salary = VALUES(monthly_salary),
           basic_salary = VALUES(basic_salary),
           allowances = VALUES(allowances),
           deductions = VALUES(deductions),
           effective_date = VALUES(effective_date),
           joining_date = VALUES(joining_date),
           employment_status = VALUES(employment_status)`,
        [id, staffName, monthly, bSalary, allow, deduct, effective_date || null, joining_date || null, employment_status || 'ACTIVE']
      );

      // Record in salary history
      await query(
        `INSERT INTO staff_salary_history 
         (staff_id, staff_name, basic_salary, allowances, deductions, effective_date, joining_date, employment_status, updated_by, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, staffName, bSalary, allow, deduct, effective_date || null, joining_date || null, employment_status || 'ACTIVE', session.id, remarks]
      );
    }

    return NextResponse.json({ status: 'success', message: 'Teacher and compensation details updated successfully' });
  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await query('DELETE FROM teachers WHERE id = ?', [id]);
    await query('DELETE FROM users WHERE id = ?', [id]);
    await query('DELETE FROM staff_salary_settings WHERE staff_id = ?', [id]);

    return NextResponse.json({ status: 'success', message: 'Teacher removed successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
