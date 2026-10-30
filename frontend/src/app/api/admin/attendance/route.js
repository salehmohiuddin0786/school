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
    const className = (searchParams.get('class') || '').trim();
    const section = (searchParams.get('section') || '').trim();
    const rawClass = className ? className.replace(/^Class\s+/i, '').trim() : '';
    const rawSection = section ? section.replace(/^Section\s+/i, '').trim() : '';

    const records = [];

    // 1. Query legacy students
    try {
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
          ON CONVERT(s.id USING utf8mb4) = CONVERT(a.student_id USING utf8mb4)
          AND DATE(a.date) = ?
        WHERE 1=1
      `;
      const params = [date];

      if (className) {
        sql += ' AND (s.class = ? OR s.class = ?)';
        params.push(className, rawClass);
      }
      if (section) {
        sql += ' AND (s.section = ? OR s.section = ?)';
        params.push(section, rawSection);
      }

      sql += ' ORDER BY s.fname ASC';
      const legacyRows = await query(sql, params);
      if (Array.isArray(legacyRows)) {
        records.push(...legacyRows);
      }
    } catch (e) {
      console.warn('Legacy attendance query warning:', e.message);
    }

    // 2. Query canonical student table
    try {
      let erpWhere = ' WHERE 1=1';
      const erpParams = [date];

      if (className) {
        erpWhere += ' AND (c.name = ? OR c.name = ? OR c.code = ?)';
        erpParams.push(className, `Class ${rawClass}`, `CLS-${rawClass}`);
      }
      if (section) {
        erpWhere += ' AND (sec.name = ? OR sec.name = ?)';
        erpParams.push(section, `Section ${rawSection}`);
      }

      const erpSql = `
        SELECT 
          s.id as student_id,
          u.firstName as fname,
          u.lastName as lname,
          COALESCE(c.name, ?) as class,
          COALESCE(sec.name, ?) as section,
          COALESCE(a.attendence, '0') as status,
          a.date as attendance_date
        FROM student s
        JOIN user u ON s.userId = u.id
        LEFT JOIN enrollment e ON s.id = e.studentId AND e.status = 'ACTIVE'
        LEFT JOIN section sec ON e.sectionId = sec.id
        LEFT JOIN course c ON sec.courseId = c.id
        LEFT JOIN attendence a 
          ON (CONVERT(s.id USING utf8mb4) = CONVERT(a.student_id USING utf8mb4) OR CONVERT(s.admissionNumber USING utf8mb4) = CONVERT(a.student_id USING utf8mb4))
          AND DATE(a.date) = ?
        ${erpWhere}
        ORDER BY u.firstName ASC
      `;

      const erpRows = await query(erpSql, [className || 'Class 10', section || 'A', ...erpParams]);
      if (Array.isArray(erpRows)) {
        const existingIds = new Set(records.map(r => String(r.student_id).toLowerCase().trim()));
        for (const er of erpRows) {
          const key = String(er.student_id).toLowerCase().trim();
          if (!existingIds.has(key)) {
            existingIds.add(key);
            records.push(er);
          }
        }
      }
    } catch (e) {
      console.warn('Canonical attendance query warning:', e.message);
    }

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
