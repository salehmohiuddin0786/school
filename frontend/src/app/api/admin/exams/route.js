import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

function isTimeOverlapping(s1, e1, s2, e2) {
  if (!s1 || !e1 || !s2 || !e2) return false;
  return s1 < e2 && e1 > s2;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('exam_id');
    const className = searchParams.get('class');
    const section = searchParams.get('section');

    const rawClass = className ? className.replace(/^Class\s+/i, '').trim() : '';
    const rawSection = section ? section.replace(/^Section\s+/i, '').trim() : '';

    if (examId) {
      let exam = null;
      let marks = [];

      try {
        const examRows = await query('SELECT * FROM exams WHERE exam_id = ?', [examId]);
        exam = examRows[0] || null;
      } catch (e) {
        console.warn('Exam query fallback:', e.message);
      }

      try {
        marks = await query(`
          SELECT 
            m.s_no,
            m.exam_id,
            m.subject,
            m.student_id,
            m.marks,
            COALESCE(s.fname, u.firstName, '') as fname,
            COALESCE(s.lname, u.lastName, '') as lname,
            COALESCE(s.class, c.name, '') as class,
            COALESCE(s.section, sec.name, '') as section
          FROM marks m
          LEFT JOIN students s ON CONVERT(m.student_id USING utf8mb4) = CONVERT(s.id USING utf8mb4)
          LEFT JOIN student st ON (CONVERT(m.student_id USING utf8mb4) = CONVERT(st.id USING utf8mb4) OR CONVERT(m.student_id USING utf8mb4) = CONVERT(st.admissionNumber USING utf8mb4))
          LEFT JOIN user u ON st.userId = u.id
          LEFT JOIN enrollment e ON st.id = e.studentId AND e.status = 'ACTIVE'
          LEFT JOIN section sec ON e.sectionId = sec.id
          LEFT JOIN course c ON sec.courseId = c.id
          WHERE m.exam_id = ?
          ORDER BY fname ASC
        `, [examId]);
      } catch (e) {
        console.warn('Marks query fallback:', e.message);
      }

      return NextResponse.json({ status: 'success', exam, marks: marks || [] });
    }

    const combinedExams = [];

    // 1. Query legacy exams table
    try {
      let sql = 'SELECT * FROM exams WHERE 1=1';
      const params = [];
      if (className) {
        sql += ' AND (class = ? OR class = ?)';
        params.push(className, rawClass);
      }
      if (section) {
        sql += ' AND (section = ? OR section = ?)';
        params.push(section, rawSection);
      }
      sql += ' ORDER BY exam_date ASC, start_time ASC, s_no DESC';

      const exams = await query(sql, params);
      if (Array.isArray(exams)) {
        combinedExams.push(...exams);
      }
    } catch (legacyErr) {
      console.warn('Legacy exams query fallback:', legacyErr.message);
    }

    // 2. Query canonical exam table if available
    try {
      let erpSql = `
        SELECT 
          e.id as s_no,
          e.id as exam_id,
          e.name as exam_title,
          COALESCE(sub.name, 'General') as subject,
          COALESCE(c.name, 'Class 10') as class,
          'A' as section,
          COALESCE(es.maxMarks, 100) as total_marks,
          COALESCE(es.passMarks, 33) as passing_marks,
          e.createdAt as timestamp,
          COALESCE(es.examDate, e.startDate) as exam_date,
          '09:00:00' as start_time,
          '12:00:00' as end_time,
          'Hall A' as room,
          CASE WHEN e.publishStatus = 'PUBLISHED' THEN 1 ELSE 0 END as is_published
        FROM exam e
        LEFT JOIN examsubject es ON es.examId = e.id
        LEFT JOIN subject sub ON es.subjectId = sub.id
        LEFT JOIN course c ON c.name LIKE '%10%'
        WHERE 1=1
      `;
      const erpParams = [];
      if (className) {
        erpSql += ' AND (c.name = ? OR c.name = ?)';
        erpParams.push(className, `Class ${rawClass}`);
      }

      const erpExams = await query(erpSql, erpParams);
      if (Array.isArray(erpExams)) {
        const existingIds = new Set(combinedExams.map(ex => (ex.exam_id || '').toLowerCase()));
        for (const ee of erpExams) {
          if (!existingIds.has((ee.exam_id || '').toLowerCase())) {
            combinedExams.push(ee);
          }
        }
      }
    } catch (erpErr) {
      console.warn('Canonical exam query fallback:', erpErr.message);
    }

    return NextResponse.json({ status: 'success', exams: combinedExams });
  } catch (error) {
    console.error('Exams GET error:', error);
    return NextResponse.json({ status: 'error', error: error.message, exams: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      action,
      exam_id,
      exam_title,
      subject,
      className,
      section = 'A',
      total_marks = 100,
      passing_marks = 33,
      exam_date,
      start_time,
      end_time,
      room,
      is_published = 1,
      marksList
    } = body;

    // Helper: Conflict Detection for Room and Class
    const checkConflicts = async (excludeExamId = null) => {
      if (!exam_date || !start_time || !end_time) return null;

      try {
        let checkSql = 'SELECT exam_id, exam_title, subject, class, section, exam_date, start_time, end_time, room FROM exams WHERE exam_date = ?';
        const checkParams = [exam_date];
        if (excludeExamId) {
          checkSql += ' AND exam_id != ?';
          checkParams.push(excludeExamId);
        }
        const existingExams = await query(checkSql, checkParams);

        if (Array.isArray(existingExams)) {
          for (const ex of existingExams) {
            if (isTimeOverlapping(start_time, end_time, ex.start_time, ex.end_time)) {
              if (room && ex.room && String(room).trim().toLowerCase() === String(ex.room).trim().toLowerCase()) {
                return `Classroom Conflict: Room "${room}" is already booked for "${ex.exam_title}" (${ex.class}-${ex.section}) from ${ex.start_time} to ${ex.end_time}.`;
              }
              if (
                String(className).trim().toLowerCase() === String(ex.class).trim().toLowerCase() &&
                String(section).trim().toLowerCase() === String(ex.section).trim().toLowerCase()
              ) {
                return `Cohort Conflict: Class ${className}-${section} already has "${ex.exam_title}" (${ex.subject}) scheduled from ${ex.start_time} to ${ex.end_time}.`;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Conflict check warning:', err.message);
      }
      return null;
    };

    if (action === 'create_exam') {
      if (!exam_title || !subject || !className) {
        return NextResponse.json({ error: 'Exam title, subject and class are required' }, { status: 400 });
      }

      // Check room and class overlap conflicts
      const conflictError = await checkConflicts();
      if (conflictError) {
        return NextResponse.json({ error: conflictError }, { status: 409 });
      }

      const newExamId = 'EX' + Date.now().toString().slice(-7);
      await query(
        `INSERT INTO exams 
         (exam_id, exam_title, subject, class, section, total_marks, passing_marks, exam_date, start_time, end_time, room, is_published, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          newExamId,
          exam_title,
          subject,
          className,
          section || 'A',
          total_marks || 100,
          passing_marks || 33,
          exam_date || null,
          start_time || null,
          end_time || null,
          room || null,
          is_published ? 1 : 0,
        ]
      );
      return NextResponse.json({ status: 'success', message: 'Exam scheduled successfully', exam_id: newExamId });
    }

    if (action === 'update_exam') {
      if (!exam_id) {
        return NextResponse.json({ error: 'exam_id is required' }, { status: 400 });
      }

      const conflictError = await checkConflicts(exam_id);
      if (conflictError) {
        return NextResponse.json({ error: conflictError }, { status: 409 });
      }

      await query(
        `UPDATE exams SET 
          exam_title = ?,
          subject = ?,
          class = ?,
          section = ?,
          total_marks = ?,
          passing_marks = ?,
          exam_date = ?,
          start_time = ?,
          end_time = ?,
          room = ?,
          is_published = ?
        WHERE exam_id = ?`,
        [
          exam_title,
          subject,
          className,
          section || 'A',
          total_marks || 100,
          passing_marks || 33,
          exam_date || null,
          start_time || null,
          end_time || null,
          room || null,
          is_published ? 1 : 0,
          exam_id,
        ]
      );
      return NextResponse.json({ status: 'success', message: 'Exam schedule updated successfully' });
    }

    if (action === 'delete_exam') {
      if (!exam_id) return NextResponse.json({ error: 'exam_id is required' }, { status: 400 });
      await query('DELETE FROM exams WHERE exam_id = ?', [exam_id]);
      await query('DELETE FROM marks WHERE exam_id = ?', [exam_id]);
      return NextResponse.json({ status: 'success', message: 'Exam deleted successfully' });
    }

    if (action === 'upload_marks') {
      if (!exam_id || !Array.isArray(marksList)) {
        return NextResponse.json({ error: 'exam_id and marksList array are required' }, { status: 400 });
      }

      for (const item of marksList) {
        const existing = await query(
          'SELECT s_no FROM marks WHERE exam_id = ? AND student_id = ?',
          [exam_id, item.student_id]
        );

        if (existing && existing.length > 0) {
          await query('UPDATE marks SET marks = ? WHERE s_no = ?', [item.marks.toString(), existing[0].s_no]);
        } else {
          await query(
            'INSERT INTO marks (exam_id, subject, student_id, marks) VALUES (?, ?, ?, ?)',
            [exam_id, subject || '', item.student_id, item.marks.toString()]
          );
        }
      }

      return NextResponse.json({ status: 'success', message: 'Marks updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Exams POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
