import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const studentId = session.id;

    const [student, attendanceStats, recentAttendance, fees, marks, notices] = await Promise.all([
      queryOne('SELECT * FROM students WHERE id = ?', [studentId]),
      query(`
        SELECT 
          COUNT(*) as total_days,
          SUM(CASE WHEN attendence = '1' THEN 1 ELSE 0 END) as present_days
        FROM attendence 
        WHERE student_id = ?
      `, [studentId]),
      query(`
        SELECT s_no, date, attendence 
        FROM attendence 
        WHERE student_id = ? 
        ORDER BY date DESC 
        LIMIT 15
      `, [studentId]),
      query(`
        SELECT s_no, month, other_collection, total, paid, balance, timestamp 
        FROM fee_record 
        WHERE id = ? 
        ORDER BY s_no DESC
      `, [studentId]),
      query(`
        SELECT 
          m.s_no,
          m.exam_id,
          m.subject,
          m.marks,
          e.exam_title,
          e.total_marks,
          e.passing_marks
        FROM marks m
        LEFT JOIN exams e ON CONVERT(m.exam_id USING utf8mb4) = CONVERT(e.exam_id USING utf8mb4)
        WHERE CONVERT(m.student_id USING utf8mb4) = CONVERT(? USING utf8mb4)
        ORDER BY m.s_no DESC
      `, [studentId]),
      query(`
        SELECT s_no, title, body, importance, timestamp 
        FROM notice 
        WHERE role = 'all' OR role = 'student' 
        ORDER BY s_no DESC 
        LIMIT 5
      `),
    ]);

    const totalDays = Number(attendanceStats[0]?.total_days || 0);
    const presentDays = Number(attendanceStats[0]?.present_days || 0);
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    return NextResponse.json({
      status: 'success',
      student,
      attendance: {
        totalDays,
        presentDays,
        percentage: attendancePercentage,
        recent: recentAttendance,
      },
      fees,
      marks,
      notices,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
