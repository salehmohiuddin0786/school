import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [
      studentCount,
      teacherCount,
      busCount,
      classCount,
      pendingLeaves,
      todayAttendance,
      recentNotices,
      reminders
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM students'),
      queryOne('SELECT COUNT(*) as count FROM teachers'),
      queryOne('SELECT COUNT(*) as count FROM buses'),
      queryOne('SELECT COUNT(DISTINCT class) as count FROM classes'),
      queryOne("SELECT COUNT(*) as count FROM leaves WHERE status = 'pending'"),
      query("SELECT attendence, COUNT(*) as count FROM attendence WHERE DATE(date) = CURDATE() GROUP BY attendence"),
      query('SELECT s_no, title, body, importance, timestamp FROM notice ORDER BY s_no DESC LIMIT 5'),
      query('SELECT s_no, id, message, status FROM reminders ORDER BY s_no DESC LIMIT 5'),
    ]);

    const presentCount = todayAttendance.find(a => a.attendence === '1' || a.attendence === 'present')?.count || 0;
    const totalToday = todayAttendance.reduce((acc, curr) => acc + curr.count, 0);

    return NextResponse.json({
      status: 'success',
      stats: {
        totalStudents: studentCount?.count || 0,
        totalTeachers: teacherCount?.count || 0,
        totalBuses: busCount?.count || 0,
        totalClasses: classCount?.count || 0,
        pendingLeaves: pendingLeaves?.count || 0,
        todayAttendance: {
          present: presentCount,
          total: totalToday,
          rate: totalToday > 0 ? Math.round((presentCount / totalToday) * 100) : 0,
        },
      },
      recentNotices,
      reminders,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
