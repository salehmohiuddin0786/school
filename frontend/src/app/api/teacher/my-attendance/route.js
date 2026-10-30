import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Teacher portal access only.' },
        { status: 403 }
      );
    }

    let records = [];
    let summary = {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      attendanceRate: 100,
    };

    if (session.tenantId) {
      // Query canonical multi-tenant schoolnext_erp staffattendance
      const staffRows = await query(
        `SELECT sa.id, sa.date, sa.status, sa.checkInTime, sa.checkOutTime, sa.remarks
         FROM schoolnext_erp.staffattendance sa
         JOIN schoolnext_erp.teacherprofile tp ON sa.teacherProfileId = tp.id
         WHERE sa.tenantId = ? AND tp.userId = ?
         ORDER BY sa.date DESC LIMIT 60`,
        [session.tenantId, session.id]
      );

      records = staffRows.map((r) => {
        let lateMin = 0;
        if (r.status === 'LATE') {
          // If checkInTime is recorded, calculate difference from standard 08:30 start
          if (r.checkInTime) {
            const checkIn = new Date(r.checkInTime);
            const standardStart = new Date(r.checkInTime);
            standardStart.setHours(8, 30, 0, 0);
            if (checkIn > standardStart) {
              lateMin = Math.round((checkIn - standardStart) / 60000);
            } else {
              lateMin = 15;
            }
          } else {
            lateMin = 15;
          }
        }

        return {
          id: r.id,
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
          status: r.status,
          checkInTime: r.checkInTime ? String(r.checkInTime).slice(11, 16) : null,
          checkOutTime: r.checkOutTime ? String(r.checkOutTime).slice(11, 16) : null,
          lateMinutes: lateMin,
          remarks: r.remarks || '',
        };
      });
    } else {
      // Fallback to legacy teacher_attendence
      const legacyRows = await query(
        `SELECT s_no as id, date, COALESCE(attendence, '1') as status, remarks
         FROM teacher_attendence
         WHERE CONVERT(teacher_id USING utf8mb4) = CONVERT(? USING utf8mb4)
         ORDER BY date DESC LIMIT 60`,
        [session.id]
      );

      records = legacyRows.map((r) => ({
        id: r.id,
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
        status: r.status === '1' || r.status === 1 || String(r.status).toUpperCase() === 'PRESENT' ? 'PRESENT' : (String(r.status).toUpperCase() === 'LATE' ? 'LATE' : 'ABSENT'),
        checkInTime: '08:30',
        checkOutTime: '15:30',
        lateMinutes: String(r.status).toUpperCase() === 'LATE' ? 15 : 0,
        remarks: r.remarks || 'Recorded',
      }));
    }

    // Calculate metrics
    if (records.length > 0) {
      summary.totalDays = records.length;
      summary.presentDays = records.length > 0 ? records.filter((r) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length : 0;
      summary.absentDays = records.filter((r) => r.status === 'ABSENT').length;
      summary.lateDays = records.filter((r) => (r.lateMinutes && r.lateMinutes > 0) || r.status === 'LATE').length;
      summary.attendanceRate = Math.round((summary.presentDays / summary.totalDays) * 100);
    }

    return NextResponse.json({
      status: 'success',
      readOnly: true,
      message: 'Personal attendance records are strictly read-only.',
      summary,
      records,
    });
  } catch (error) {
    console.error('Teacher my-attendance error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

// Strictly block any modification attempt
export async function POST() {
  return NextResponse.json(
    { status: 'error', message: 'Forbidden: Teachers cannot mark, modify, or falsify their own attendance.' },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { status: 'error', message: 'Forbidden: Teachers cannot mark, modify, or falsify their own attendance.' },
    { status: 403 }
  );
}
