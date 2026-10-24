import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const teacherId = session.id;

    const [teacher, studentsCount, myAttendance, myLeaves, notices] = await Promise.all([
      queryOne('SELECT * FROM teachers WHERE id = ?', [teacherId]),
      queryOne('SELECT COUNT(*) as count FROM students WHERE CONVERT(class USING utf8mb4) = (SELECT CONVERT(class USING utf8mb4) FROM teachers WHERE id = ? LIMIT 1)', [teacherId]),
      query('SELECT * FROM teacher_attendence WHERE teacher_id = ? ORDER BY date DESC LIMIT 15', [teacherId]),
      query('SELECT * FROM leaves WHERE sender_id = ? ORDER BY s_no DESC LIMIT 10', [teacherId]),
      query("SELECT s_no, title, body, importance, timestamp FROM notice WHERE role = 'all' OR role = 'teacher' ORDER BY s_no DESC LIMIT 5"),
    ]);

    return NextResponse.json({
      status: 'success',
      teacher,
      assignedStudentsCount: studentsCount?.count || 0,
      myAttendance,
      myLeaves,
      notices,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
