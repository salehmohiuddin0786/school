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
    let teacher = null;

    // 1. Try legacy teachers table
    try {
      teacher = await queryOne(
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
          ON CONVERT(t.id USING utf8mb4) = CONVERT(sss.staff_id USING utf8mb4)
        WHERE t.id = ?`,
        [id]
      );
    } catch (e) {
      console.warn('Teacher legacy GET error:', e.message);
    }

    // 2. Fallback to canonical teacherprofile + user
    if (!teacher) {
      try {
        const canonical = await queryOne(
          `SELECT 
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
          WHERE tp.id = ? OR tp.employeeCode = ? OR u.id = ?`,
          [id, id, id]
        );
        if (canonical) {
          teacher = canonical;
        }
      } catch (e) {
        console.warn('Teacher canonical GET error:', e.message);
      }
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Fetch salary history
    let history = [];
    try {
      history = await query(
        `SELECT id, basic_salary, allowances, deductions, effective_date, joining_date, employment_status, updated_by, remarks, created_at
         FROM staff_salary_history
         WHERE staff_id = ?
         ORDER BY id DESC`,
        [id]
      );
    } catch (e) {
      console.warn('Salary history query warning:', e.message);
    }

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
    
    if (teacher) {
      // Update legacy teacher info
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
          [id, staffName, bSalary, allow, deduct, effective_date || null, joining_date || null, employment_status || 'ACTIVE', session.id || 'admin', remarks]
        );
      }
    } else {
      // Check if it is a canonical teacher
      const canonicalTeacher = await queryOne('SELECT tp.id, tp.userId FROM teacherprofile tp WHERE tp.id = ? OR tp.employeeCode = ?', [id, id]);
      if (canonicalTeacher) {
        if (fname || lname || phone) {
          await query(
            `UPDATE user SET 
               firstName = COALESCE(?, firstName),
               lastName = COALESCE(?, lastName),
               phone = COALESCE(?, phone),
               updatedAt = NOW()
             WHERE id = ?`,
            [fname, lname, phone, canonicalTeacher.userId]
          );
        }
        if (subject) {
          await query(
            `UPDATE teacherprofile SET specialization = ?, updatedAt = NOW() WHERE id = ?`,
            [subject, canonicalTeacher.id]
          );
        }
      } else {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }
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
    await query('DELETE FROM staff_salary_history WHERE staff_id = ?', [id]);

    try {
      const canonical = await queryOne('SELECT id, userId FROM teacherprofile WHERE id = ? OR employeeCode = ?', [id, id]);
      if (canonical) {
        await query('DELETE FROM teacherprofile WHERE id = ?', [canonical.id]);
        await query('DELETE FROM user WHERE id = ?', [canonical.userId]);
      }
    } catch (e) {
      console.warn('Canonical teacher delete warning:', e.message);
    }

    return NextResponse.json({ status: 'success', message: 'Teacher removed successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
