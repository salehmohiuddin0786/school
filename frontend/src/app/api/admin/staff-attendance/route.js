import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const month = searchParams.get('month'); // optional YYYY-MM

    // 1. Daily staff attendance list
    const sql = `
      SELECT 
        t.id as teacher_id,
        t.fname,
        t.lname,
        t.subject,
        t.email,
        t.phone,
        COALESCE(ta.attendence, 'NOT_MARKED') as status,
        ta.remarks,
        ta.updated_at
      FROM teachers t
      LEFT JOIN teacher_attendence ta 
        ON t.id = ta.teacher_id
        AND ta.date = ?
      ORDER BY t.fname ASC
    `;
    const staffRecords = await query(sql, [date]);

    // 2. Monthly summary stats
    const targetMonth = month || date.substring(0, 7);
    const summaryRows = await query(`
      SELECT 
        attendence as status,
        COUNT(*) as count
      FROM teacher_attendence
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
      GROUP BY attendence
    `, [targetMonth]);

    const summary = {
      PRESENT: 0,
      ABSENT: 0,
      HALF_DAY: 0,
      LATE: 0,
      PAID_LEAVE: 0,
      UNPAID_LEAVE: 0,
    };
    for (const row of summaryRows) {
      if (summary[row.status] !== undefined) {
        summary[row.status] = row.count;
      }
    }

    return NextResponse.json({
      status: 'success',
      date,
      month: targetMonth,
      records: staffRecords,
      summary,
    });
  } catch (error) {
    console.error('Staff attendance GET error:', error);
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
    const { date, attendanceList } = body;

    if (!date || !Array.isArray(attendanceList) || attendanceList.length === 0) {
      return NextResponse.json({ error: 'date and attendanceList are required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return NextResponse.json({ error: 'Cannot record staff attendance for future dates.' }, { status: 400 });
    }

    for (const item of attendanceList) {
      if (!item.teacher_id || !item.status) continue;
      await query(
        `INSERT INTO teacher_attendence (teacher_id, attendence, date, source, marked_by, remarks, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
           attendence = VALUES(attendence),
           remarks = VALUES(remarks),
           marked_by = VALUES(marked_by),
           updated_at = NOW()`,
        [item.teacher_id, item.status, date, session.id || 'admin', item.remarks || null]
      );
    }

    return NextResponse.json({
      status: 'success',
      message: `Staff attendance for ${date} recorded successfully`,
    });
  } catch (error) {
    console.error('Staff attendance POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
