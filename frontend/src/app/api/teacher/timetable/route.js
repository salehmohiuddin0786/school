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

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    let weekly = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    if (session.tenantId) {
      // Find teacherProfileId for session.id
      const tpRows = await query(
        `SELECT id FROM schoolnext_erp.teacherprofile WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [session.id, session.tenantId]
      );
      const teacherProfileId = tpRows?.[0]?.id;

      if (teacherProfileId) {
        // Query timetable entries for this teacher
        const entries = await query(
          `SELECT 
            te.id,
            te.dayOfWeek,
            te.periodNumber,
            te.startTime,
            te.endTime,
            te.roomNumber,
            c.name as courseName,
            c.code as courseCode,
            sec.name as sectionName,
            ts.id as substitutionId,
            ts.date as subDate,
            ts.status as subStatus,
            subU.firstName as subFname,
            subU.lastName as subLname
          FROM schoolnext_erp.timetableentry te
          JOIN schoolnext_erp.course c ON te.courseId = c.id
          JOIN schoolnext_erp.section sec ON te.sectionId = sec.id
          LEFT JOIN schoolnext_erp.teachersubstitution ts 
            ON te.id = ts.timetableEntryId AND ts.date = ? AND ts.status = 'ACTIVE'
          LEFT JOIN schoolnext_erp.teacherprofile subTp ON ts.substituteTeacherId = subTp.id
          LEFT JOIN schoolnext_erp.user subU ON subTp.userId = subU.id
          WHERE te.tenantId = ? AND te.teacherProfileId = ?
          ORDER BY te.periodNumber ASC`,
          [dateStr, session.tenantId, teacherProfileId]
        );

        entries.forEach((e) => {
          const day = e.dayOfWeek?.charAt(0).toUpperCase() + e.dayOfWeek?.slice(1).toLowerCase();
          if (weekly[day]) {
            weekly[day].push({
              id: e.id,
              periodNumber: e.periodNumber,
              time: `${e.startTime} - ${e.endTime}`,
              subject: `${e.courseName} (${e.courseCode})`,
              class: `Class ${e.sectionName}`,
              room: e.roomNumber || 'Room 101',
              isSubstituted: !!e.substitutionId,
              substituteName: e.subFname ? `${e.subFname} ${e.subLname || ''}`.trim() : null,
              isCovering: false,
            });
          }
        });

        // Also query if THIS teacher is assigned as a substitute on dateStr
        const coveringRows = await query(
          `SELECT 
            ts.id as substitutionId,
            ts.date,
            te.periodNumber,
            te.startTime,
            te.endTime,
            te.roomNumber,
            c.name as courseName,
            c.code as courseCode,
            sec.name as sectionName,
            origU.firstName as origFname,
            origU.lastName as origLname
          FROM schoolnext_erp.teachersubstitution ts
          JOIN schoolnext_erp.timetableentry te ON ts.timetableEntryId = te.id
          JOIN schoolnext_erp.course c ON te.courseId = c.id
          JOIN schoolnext_erp.section sec ON te.sectionId = sec.id
          JOIN schoolnext_erp.teacherprofile origTp ON ts.originalTeacherId = origTp.id
          JOIN schoolnext_erp.user origU ON origTp.userId = origU.id
          WHERE ts.tenantId = ? AND ts.substituteTeacherId = ? AND ts.date = ? AND ts.status = 'ACTIVE'`,
          [session.tenantId, teacherProfileId, dateStr]
        );

        coveringRows.forEach((cRow) => {
          const item = {
            id: `sub-${cRow.substitutionId}`,
            periodNumber: cRow.periodNumber,
            time: `${cRow.startTime} - ${cRow.endTime}`,
            subject: `${cRow.courseName} (Substituted Assignment)`,
            class: `Class ${cRow.sectionName}`,
            room: cRow.roomNumber || 'Room 202',
            isSubstituted: false,
            isCovering: true,
            coveringFor: `${cRow.origFname} ${cRow.origLname || ''}`.trim(),
          };

          if (weekly[todayDayName]) {
            weekly[todayDayName].push(item);
            weekly[todayDayName].sort((a, b) => a.periodNumber - b.periodNumber);
          }
        });
      }
    }

    // Default mock timetable if database had no entries
    const hasAny = Object.values(weekly).some((arr) => arr.length > 0);
    if (!hasAny) {
      weekly = {
        Monday: [
          { id: 1, periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics (MATH-10)', class: 'Class 10-A', room: 'Room 201', isSubstituted: false },
          { id: 2, periodNumber: 2, time: '10:00 AM - 10:45 AM', subject: 'Algebra & Geometry', class: 'Class 12-A', room: 'Room 304', isSubstituted: false },
          { id: 3, periodNumber: 3, time: '11:15 AM - 12:00 PM', subject: 'Remedial Science', class: 'Class 9-B', room: 'Physics Lab', isSubstituted: false },
          { id: 4, periodNumber: 4, time: '01:00 PM - 01:45 PM', subject: 'Advanced Calculus', class: 'Class 12-A', room: 'Room 304', isSubstituted: false },
        ],
        Tuesday: [
          { id: 5, periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics (MATH-10)', class: 'Class 10-A', room: 'Room 201', isSubstituted: false },
          { id: 6, periodNumber: 2, time: '10:00 AM - 10:45 AM', subject: 'Problem Solving Workshop', class: 'Class 11-A', room: 'Library', isSubstituted: false },
          { id: 7, periodNumber: 3, time: '11:15 AM - 12:00 PM', subject: 'Science Foundations', class: 'Class 9-B', room: 'Room 102', isSubstituted: false },
        ],
        Wednesday: [
          { id: 8, periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics (MATH-10)', class: 'Class 10-A', room: 'Room 201', isSubstituted: false },
          { id: 9, periodNumber: 2, time: '10:00 AM - 10:45 AM', subject: 'Mathematical Logic', class: 'Class 12-A', room: 'Room 304', isSubstituted: false },
          { id: 10, periodNumber: 3, time: '01:00 PM - 01:45 PM', subject: 'Doubt Clearing Session', class: 'Class 10-A', room: 'Room 201', isSubstituted: false },
        ],
        Thursday: [
          { id: 11, periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics (MATH-10)', class: 'Class 10-A', room: 'Room 201', isSubstituted: false },
          { id: 12, periodNumber: 2, time: '11:15 AM - 12:00 PM', subject: 'Applied Mathematics', class: 'Class 9-B', room: 'Lab 2', isSubstituted: false },
          { id: 13, periodNumber: 3, time: '01:00 PM - 01:45 PM', subject: 'Mathematics Seminar', class: 'Class 12-A', room: 'Room 304', isSubstituted: false },
        ],
        Friday: [
          { id: 14, periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Weekly Assessment', class: 'Class 10-A', room: 'Exam Hall', isSubstituted: false },
          { id: 15, periodNumber: 2, time: '10:00 AM - 10:45 AM', subject: 'Calculus Review', class: 'Class 12-A', room: 'Room 304', isSubstituted: false },
          { id: 16, periodNumber: 3, time: '11:15 AM - 12:00 PM', subject: 'Faculty Assembly', class: 'All Staff', room: 'Auditorium', isSubstituted: false },
        ],
        Saturday: [
          { id: 17, periodNumber: 1, time: '09:00 AM - 10:30 AM', subject: 'Extra Coaching & Remedial', class: 'Class 10-A', room: 'Room 201', isSubstituted: false },
          { id: 18, periodNumber: 2, time: '11:00 AM - 12:30 PM', subject: 'Co-Curricular / Activity', class: 'Campus Wide', room: 'Ground', isSubstituted: false },
        ],
      };
    }

    const todaySlots = weekly[todayDayName] || [];

    return NextResponse.json({
      status: 'success',
      todayDayName,
      date: dateStr,
      todaySlots,
      weekly,
    });
  } catch (error) {
    console.error('Teacher timetable error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
