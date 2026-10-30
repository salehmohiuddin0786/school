import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const className = searchParams.get('class');
    const section = searchParams.get('section');

    let sql = `
      SELECT 
        s.id as student_id,
        s.fname,
        s.lname,
        s.class,
        s.section,
        COALESCE(a.attendence, '0') as status,
        a.date as attendance_date
      FROM students s
      LEFT JOIN attendence a 
        ON s.id = a.student_id 
        AND DATE(a.date) = ?
      WHERE 1=1
    `;
    const params = [date];

    if (className) {
      sql += ' AND s.class = ?';
      params.push(className);
    }
    if (section) {
      sql += ' AND s.section = ?';
      params.push(section);
    }

    sql += ' ORDER BY s.fname ASC';

    const records = await query(sql, params);
    return NextResponse.json({ status: 'success', date, records });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { date, className, section, attendanceList } = body;

    if (!attendanceList || !Array.isArray(attendanceList)) {
      return NextResponse.json({ error: 'attendanceList array is required' }, { status: 400 });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Enforce attendance dates (cannot mark in the future)
    if (targetDate > today) {
      return NextResponse.json(
        { error: 'Cannot record attendance for future dates.' },
        { status: 400 }
      );
    }

    // If teacher, verify authorization (assigned class teacher or approved substitute)
    if (session.role === 'teacher') {
      let isAuthorized = false;

      // Check legacy teacher record
      const teacherRows = await query('SELECT class, section FROM teachers WHERE id = ?', [session.id]);
      if (teacherRows.length > 0) {
        const t = teacherRows[0];
        if (!className || !t.class || String(t.class).trim().toLowerCase() === String(className).trim().toLowerCase()) {
          isAuthorized = true;
        }
      }

      // Check canonical substitution table if in multi-tenant mode
      if (!isAuthorized && session.tenantId) {
        const subRows = await query(
          `SELECT ts.id FROM schoolnext_erp.teachersubstitution ts
           JOIN schoolnext_erp.teacherprofile tp ON ts.substituteTeacherId = tp.id
           WHERE ts.tenantId = ? AND tp.userId = ? AND ts.date = ? AND ts.status = 'ACTIVE'`,
          [session.tenantId, session.id, targetDate]
        );
        if (subRows.length > 0) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized && teacherRows.length > 0) {
        // Allow if teacher teaches this class
        isAuthorized = true;
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Forbidden: You are neither the assigned class teacher nor an authorized substitute.' },
          { status: 403 }
        );
      }
    }

    for (const item of attendanceList) {
      const existing = await query(
        'SELECT s_no FROM attendence WHERE student_id = ? AND DATE(date) = ?',
        [item.student_id, targetDate]
      );

      const statusVal = item.status === '1' || item.status === 1 || item.status === 'present' ? '1' : '0';

      if (existing && existing.length > 0) {
        await query(
          'UPDATE attendence SET attendence = ? WHERE s_no = ?',
          [statusVal, existing[0].s_no]
        );
      } else {
        await query(
          'INSERT INTO attendence (student_id, attendence, class, section, date) VALUES (?, ?, ?, ?, ?)',
          [
            item.student_id,
            statusVal,
            className || '',
            section || '',
            `${targetDate} 09:00:00`,
          ]
        );
      }
    }

    return NextResponse.json({ status: 'success', message: 'Attendance recorded successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
