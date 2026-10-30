import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized. Admin access only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let substitutions = [];
    let teachers = [];
    let timetableEntries = [];

    if (session.tenantId) {
      // Fetch substitutions
      let sql = `
        SELECT 
          ts.id,
          ts.date,
          ts.status,
          ts.remarks,
          ts.createdAt,
          origU.firstName as origFname,
          origU.lastName as origLname,
          origTp.employeeCode as origEmpCode,
          subU.firstName as subFname,
          subU.lastName as subLname,
          subTp.employeeCode as subEmpCode,
          te.startTime,
          te.endTime,
          cr.roomNumber,
          te.dayOfWeek,
          subj.name as subjectName,
          c.name as courseName,
          sec.name as sectionName
        FROM schoolnext_erp.teachersubstitution ts
        JOIN schoolnext_erp.teacherprofile origTp ON ts.originalTeacherId = origTp.id
        JOIN schoolnext_erp.user origU ON origTp.userId = origU.id
        JOIN schoolnext_erp.teacherprofile subTp ON ts.substituteTeacherId = subTp.id
        JOIN schoolnext_erp.user subU ON subTp.userId = subU.id
        JOIN schoolnext_erp.timetableentry te ON ts.timetableEntryId = te.id
        JOIN schoolnext_erp.section sec ON te.sectionId = sec.id
        LEFT JOIN schoolnext_erp.course c ON sec.courseId = c.id
        LEFT JOIN schoolnext_erp.subject subj ON te.subjectId = subj.id
        LEFT JOIN schoolnext_erp.classroom cr ON te.classRoomId = cr.id
        WHERE ts.tenantId = ?
      `;
      const params = [session.tenantId];
      if (date) {
        sql += ` AND ts.date = ?`;
        params.push(date);
      }
      sql += ` ORDER BY ts.date DESC, te.startTime ASC`;

      const rows = await query(sql, params);
      substitutions = rows.map((r, idx) => {
        let reason = 'LEAVE';
        let notes = r.remarks || '';
        if (r.remarks && r.remarks.includes(':')) {
          const parts = r.remarks.split(':');
          reason = parts[0].trim();
          notes = parts.slice(1).join(':').trim();
        } else if (r.remarks) {
          reason = r.remarks;
        }

        return {
          id: r.id,
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
          status: r.status,
          reason,
          notes,
          periodNumber: idx + 1,
          time: `${r.startTime} - ${r.endTime}`,
          room: r.roomNumber || 'Main Hall',
          dayOfWeek: r.dayOfWeek,
          courseName: r.courseName || r.subjectName || 'Academics',
          sectionName: r.sectionName,
          originalTeacher: `${r.origFname} ${r.origLname || ''}`.trim(),
          substituteTeacher: `${r.subFname} ${r.subLname || ''}`.trim(),
        };
      });

      // Fetch teachers for dropdown
      const tRows = await query(
        `SELECT tp.id, tp.employeeCode, u.firstName, u.lastName 
         FROM schoolnext_erp.teacherprofile tp
         JOIN schoolnext_erp.user u ON tp.userId = u.id
         WHERE tp.tenantId = ? ORDER BY u.firstName ASC`,
        [session.tenantId]
      );
      teachers = tRows.map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName || ''}`.trim(),
        code: t.employeeCode,
      }));

      // Fetch timetable entries for dropdown
      const teRows = await query(
        `SELECT 
          te.id,
          te.dayOfWeek,
          te.startTime,
          te.endTime,
          te.teacherProfileId,
          subj.name as subjectName,
          c.name as courseName,
          sec.name as sectionName,
          u.firstName as origFname,
          u.lastName as origLname
        FROM schoolnext_erp.timetableentry te
        JOIN schoolnext_erp.section sec ON te.sectionId = sec.id
        LEFT JOIN schoolnext_erp.course c ON sec.courseId = c.id
        LEFT JOIN schoolnext_erp.subject subj ON te.subjectId = subj.id
        LEFT JOIN schoolnext_erp.teacherprofile tp ON te.teacherProfileId = tp.id
        LEFT JOIN schoolnext_erp.user u ON tp.userId = u.id
        WHERE te.tenantId = ?
        ORDER BY te.dayOfWeek ASC, te.startTime ASC`,
        [session.tenantId]
      );
      timetableEntries = teRows.map((e, idx) => ({
        id: e.id,
        dayOfWeek: e.dayOfWeek,
        periodNumber: idx + 1,
        time: `${e.startTime} - ${e.endTime}`,
        courseName: e.courseName || e.subjectName || 'Academics',
        sectionName: e.sectionName,
        teacherProfileId: e.teacherProfileId,
        currentTeacher: `${e.origFname || 'Unassigned'} ${e.origLname || ''}`.trim(),
      }));
    }

    return NextResponse.json({
      status: 'success',
      substitutions,
      teachers,
      timetableEntries,
    });
  } catch (error) {
    console.error('Substitutions GET error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized. Admin access only.' }, { status: 403 });
    }

    const body = await request.json();
    const { timetableEntryId, substituteTeacherId, date, reason, notes } = body;

    if (!timetableEntryId || !substituteTeacherId || !date) {
      return NextResponse.json(
        { status: 'error', message: 'timetableEntryId, substituteTeacherId, and date are required.' },
        { status: 400 }
      );
    }

    if (session.tenantId) {
      // 1. Get the target timetable entry
      const teRows = await query(
        `SELECT id, teacherProfileId, dayOfWeek, periodNumber, startTime, endTime 
         FROM schoolnext_erp.timetableentry 
         WHERE id = ? AND tenantId = ? LIMIT 1`,
        [timetableEntryId, session.tenantId]
      );
      if (!teRows || teRows.length === 0) {
        return NextResponse.json({ status: 'error', message: 'Timetable entry not found.' }, { status: 404 });
      }
      const targetEntry = teRows[0];
      const originalTeacherId = targetEntry.teacherProfileId;

      if (originalTeacherId === substituteTeacherId) {
        return NextResponse.json(
          { status: 'error', message: 'Substitute teacher cannot be the same as the original teacher.' },
          { status: 400 }
        );
      }

      // 2. Conflict check: Does substitute have a regular scheduled class at this day and period?
      const subRecurringConflict = await query(
        `SELECT id FROM schoolnext_erp.timetableentry 
         WHERE tenantId = ? AND teacherProfileId = ? AND dayOfWeek = ? AND periodNumber = ? LIMIT 1`,
        [session.tenantId, substituteTeacherId, targetEntry.dayOfWeek, targetEntry.periodNumber]
      );
      if (subRecurringConflict.length > 0) {
        return NextResponse.json(
          { 
            status: 'error', 
            message: `Conflict: Substitute teacher is already assigned to a recurring class on ${targetEntry.dayOfWeek} period ${targetEntry.periodNumber}.` 
          },
          { status: 409 }
        );
      }

      // 3. Conflict check: Does substitute already have another ACTIVE substitution on this date at this period?
      const subActiveSubConflict = await query(
        `SELECT ts.id FROM schoolnext_erp.teachersubstitution ts
         JOIN schoolnext_erp.timetableentry te ON ts.timetableEntryId = te.id
         WHERE ts.tenantId = ? AND ts.substituteTeacherId = ? AND ts.date = ? 
           AND te.periodNumber = ? AND ts.status = 'ACTIVE' LIMIT 1`,
        [session.tenantId, substituteTeacherId, date, targetEntry.periodNumber]
      );
      if (subActiveSubConflict.length > 0) {
        return NextResponse.json(
          { 
            status: 'error', 
            message: `Conflict: Substitute teacher already has an active substitution assignment on ${date} during period ${targetEntry.periodNumber}.` 
          },
          { status: 409 }
        );
      }

      // 4. Create substitution record
      const generatedId = `ts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const remarksText = notes ? `${reason || 'LEAVE'}: ${notes}` : (reason || 'LEAVE');
      await query(
        `INSERT INTO schoolnext_erp.teachersubstitution 
          (id, tenantId, timetableEntryId, originalTeacherId, substituteTeacherId, date, status, remarks, assignedById, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, NOW(), NOW())`,
        [
          generatedId,
          session.tenantId,
          timetableEntryId,
          originalTeacherId,
          substituteTeacherId,
          date,
          remarksText,
          session.id,
        ]
      );

      return NextResponse.json({
        status: 'success',
        message: 'Substitute teacher assigned successfully with verified conflict clearance.',
        substitutionId: generatedId,
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Substitution assigned successfully (preview mode).',
    });
  } catch (error) {
    console.error('Substitutions POST error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
