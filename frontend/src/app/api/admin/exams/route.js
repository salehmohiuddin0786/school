import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('exam_id');
    const className = searchParams.get('class');

    if (examId) {
      const exam = await query('SELECT * FROM exams WHERE exam_id = ?', [examId]);
      const marks = await query(`
        SELECT 
          m.s_no,
          m.exam_id,
          m.subject,
          m.student_id,
          m.marks,
          s.fname,
          s.lname,
          s.class,
          s.section
        FROM marks m
        JOIN students s ON m.student_id COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci
        WHERE m.exam_id = ?
        ORDER BY s.fname ASC
      `, [examId]);
      return NextResponse.json({ status: 'success', exam: exam[0] || null, marks });
    }

    let sql = 'SELECT * FROM exams WHERE 1=1';
    const params = [];
    if (className) {
      sql += ' AND class = ?';
      params.push(className);
    }
    sql += ' ORDER BY s_no DESC';

    const exams = await query(sql, params);
    return NextResponse.json({ status: 'success', exams });
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
    const { action, exam_title, subject, className, section, total_marks, passing_marks, exam_id, marksList } = body;

    if (action === 'create_exam') {
      const newExamId = 'EX' + Date.now().toString().slice(-7);
      await query(
        `INSERT INTO exams (exam_id, exam_title, subject, class, section, total_marks, passing_marks, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [newExamId, exam_title, subject, className, section || 'A', total_marks || 100, passing_marks || 33]
      );
      return NextResponse.json({ status: 'success', message: 'Exam created successfully', exam_id: newExamId });
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
          await query(
            'UPDATE marks SET marks = ? WHERE s_no = ?',
            [item.marks.toString(), existing[0].s_no]
          );
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
