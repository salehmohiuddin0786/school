import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function isTimeOverlapping(s1, e1, s2, e2) {
  if (!s1 || !e1 || !s2 || !e2) return false;
  return s1 < e2 && e1 > s2;
}

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const className = searchParams.get('class') || '';
    const section = searchParams.get('section') || '';
    const weekday = searchParams.get('weekday') || '';

    let sql = `
      SELECT 
        pt.id,
        pt.class,
        pt.section,
        pt.weekday,
        pt.period_number,
        pt.period_name,
        pt.start_time,
        pt.end_time,
        pt.subject,
        pt.teacher_id,
        pt.classroom,
        pt.is_break,
        t.fname as teacher_fname,
        t.lname as teacher_lname
      FROM period_timetable pt
      LEFT JOIN teachers t ON pt.teacher_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (className) {
      sql += ' AND pt.class = ?';
      params.push(className);
    }
    if (section) {
      sql += ' AND pt.section = ?';
      params.push(section);
    }
    if (weekday) {
      sql += ' AND pt.weekday = ?';
      params.push(weekday);
    }

    sql += ' ORDER BY FIELD(pt.weekday, "MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"), pt.period_number ASC';

    const entries = await query(sql, params);

    return NextResponse.json({ status: 'success', entries });
  } catch (error) {
    console.error('Timetable GET error:', error);
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
    const {
      id,
      className,
      section = 'A',
      weekday,
      period_number,
      period_name,
      start_time,
      end_time,
      subject,
      teacher_id,
      classroom,
      is_break = false,
    } = body;

    if (!className || !weekday || !period_number || !start_time || !end_time) {
      return NextResponse.json({ error: 'Class, weekday, period number, start and end times are required' }, { status: 400 });
    }

    // CONFLICT DETECTION
    // Query other slots on the same weekday
    let checkSql = 'SELECT id, class, section, weekday, period_number, start_time, end_time, subject, teacher_id, classroom FROM period_timetable WHERE weekday = ?';
    const checkParams = [weekday];
    if (id) {
      checkSql += ' AND id != ?';
      checkParams.push(id);
    }
    const existingSlots = await query(checkSql, checkParams);

    for (const slot of existingSlots) {
      if (isTimeOverlapping(start_time, end_time, slot.start_time, slot.end_time)) {
        // 1. Teacher Conflict (if not break and teacher is assigned)
        if (!is_break && teacher_id && slot.teacher_id && String(teacher_id) === String(slot.teacher_id)) {
          const teacher = await queryOne('SELECT fname, lname FROM teachers WHERE id = ?', [teacher_id]);
          const tName = teacher ? `${teacher.fname} ${teacher.lname || ''}`.trim() : teacher_id;
          return NextResponse.json(
            { error: `Teacher Conflict: ${tName} is already assigned to Class ${slot.class}-${slot.section} (${slot.subject}) from ${slot.start_time} to ${slot.end_time}.` },
            { status: 409 }
          );
        }

        // 2. Classroom Conflict
        if (classroom && slot.classroom && String(classroom).trim().toLowerCase() === String(slot.classroom).trim().toLowerCase()) {
          return NextResponse.json(
            { error: `Classroom Conflict: Room "${classroom}" is already reserved for Class ${slot.class}-${slot.section} from ${slot.start_time} to ${slot.end_time}.` },
            { status: 409 }
          );
        }

        // 3. Cohort (Class & Section) Conflict
        if (
          String(className).trim().toLowerCase() === String(slot.class).trim().toLowerCase() &&
          String(section).trim().toLowerCase() === String(slot.section).trim().toLowerCase()
        ) {
          return NextResponse.json(
            { error: `Cohort Conflict: Class ${className}-${section} already has "${slot.subject}" scheduled from ${slot.start_time} to ${slot.end_time}.` },
            { status: 409 }
          );
        }
      }
    }

    if (id) {
      await query(
        `UPDATE period_timetable SET 
          class = ?,
          section = ?,
          weekday = ?,
          period_number = ?,
          period_name = ?,
          start_time = ?,
          end_time = ?,
          subject = ?,
          teacher_id = ?,
          classroom = ?,
          is_break = ?
        WHERE id = ?`,
        [
          className,
          section,
          weekday,
          parseInt(period_number, 10),
          period_name || `Period ${period_number}`,
          start_time,
          end_time,
          is_break ? (subject || 'Break') : subject,
          is_break ? null : (teacher_id || null),
          classroom || null,
          is_break ? 1 : 0,
          id
        ]
      );
      return NextResponse.json({ status: 'success', message: 'Timetable period updated successfully' });
    }

    // Insert new slot
    await query(
      `INSERT INTO period_timetable 
       (class, section, weekday, period_number, period_name, start_time, end_time, subject, teacher_id, classroom, is_break)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         period_name = VALUES(period_name),
         start_time = VALUES(start_time),
         end_time = VALUES(end_time),
         subject = VALUES(subject),
         teacher_id = VALUES(teacher_id),
         classroom = VALUES(classroom),
         is_break = VALUES(is_break)`,
      [
        className,
        section,
        weekday,
        parseInt(period_number, 10),
        period_name || `Period ${period_number}`,
        start_time,
        end_time,
        is_break ? (subject || 'Break') : subject,
        is_break ? null : (teacher_id || null),
        classroom || null,
        is_break ? 1 : 0,
      ]
    );

    return NextResponse.json({ status: 'success', message: 'Timetable period scheduled successfully' });
  } catch (error) {
    console.error('Timetable POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });

    await query('DELETE FROM period_timetable WHERE id = ?', [id]);
    return NextResponse.json({ status: 'success', message: 'Period removed from timetable' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
