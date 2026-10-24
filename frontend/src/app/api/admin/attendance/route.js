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
        ON s.id COLLATE utf8mb4_unicode_ci = a.student_id COLLATE utf8mb4_unicode_ci 
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
    // attendanceList is array of { student_id, status: '1' or '0' }

    if (!attendanceList || !Array.isArray(attendanceList)) {
      return NextResponse.json({ error: 'attendanceList array is required' }, { status: 400 });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    for (const item of attendanceList) {
      // Check if attendance already exists for this student on this date
      const existing = await query(
        'SELECT s_no FROM attendence WHERE student_id = ? AND DATE(date) = ?',
        [item.student_id, targetDate]
      );

      if (existing && existing.length > 0) {
        await query(
          'UPDATE attendence SET attendence = ? WHERE s_no = ?',
          [item.status === '1' || item.status === 1 || item.status === 'present' ? '1' : '0', existing[0].s_no]
        );
      } else {
        await query(
          'INSERT INTO attendence (student_id, attendence, class, section, date) VALUES (?, ?, ?, ?, ?)',
          [
            item.student_id,
            item.status === '1' || item.status === 1 || item.status === 'present' ? '1' : '0',
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
