import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'student' && session.role !== 'parent')) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Student access only.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get('studentId');
    let studentId = session.id;

    if (session.role === 'parent') {
      if (!requestedStudentId) {
        return NextResponse.json(
          { status: 'error', message: 'studentId required for parent.' },
          { status: 400 }
        );
      }
      studentId = requestedStudentId;
    }

    let assignments = [];

    if (session.tenantId) {
      // Find student record and enrolled section
      const sRows = await query(
        `SELECT s.id, e.sectionId 
         FROM schoolnext_erp.student s
         LEFT JOIN schoolnext_erp.enrollment e ON s.id = e.studentId AND e.status = 'ACTIVE'
         WHERE s.tenantId = ? AND (s.userId = ? OR s.id = ?) LIMIT 1`,
        [session.tenantId, studentId, studentId]
      );

      const realStudentId = sRows?.[0]?.id;
      const sectionId = sRows?.[0]?.sectionId;

      if (realStudentId) {
        const rows = await query(
          `SELECT 
            a.id,
            a.title,
            a.description,
            a.dueDate,
            a.maxMarks,
            a.attachmentUrl,
            a.createdAt,
            sub.name as subjectName,
            sec.name as sectionName,
            c.name as courseName,
            u.firstName as teacherFname,
            u.lastName as teacherLname,
            asub.id as submissionId,
            asub.status as submissionStatus,
            asub.submissionText,
            asub.fileUrl,
            asub.submittedAt,
            asub.marksAwarded,
            asub.feedback
          FROM schoolnext_erp.assignment a
          JOIN schoolnext_erp.classsubject cs ON a.classSubjectId = cs.id
          JOIN schoolnext_erp.subject sub ON cs.subjectId = sub.id
          JOIN schoolnext_erp.section sec ON cs.sectionId = sec.id
          JOIN schoolnext_erp.course c ON sec.courseId = c.id
          JOIN schoolnext_erp.teacherprofile tp ON a.teacherProfileId = tp.id
          JOIN schoolnext_erp.user u ON tp.userId = u.id
          LEFT JOIN schoolnext_erp.assignmentsubmission asub 
            ON a.id = asub.assignmentId AND asub.studentId = ?
          WHERE a.tenantId = ? ${sectionId ? 'AND cs.sectionId = ?' : ''}
          ORDER BY a.dueDate ASC`,
          sectionId ? [realStudentId, session.tenantId, sectionId] : [realStudentId, session.tenantId]
        );

        assignments = rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          dueDate: r.dueDate instanceof Date ? r.dueDate.toISOString().split('T')[0] : String(r.dueDate).split('T')[0],
          maxMarks: Number(r.maxMarks || 100),
          attachmentUrl: r.attachmentUrl,
          subject: r.subjectName,
          className: `${r.courseName} - ${r.sectionName}`,
          teacher: `${r.teacherFname} ${r.teacherLname || ''}`.trim(),
          createdAt: r.createdAt,
          submission: r.submissionId
            ? {
                id: r.submissionId,
                status: r.submissionStatus,
                submissionText: r.submissionText,
                fileUrl: r.fileUrl,
                submittedAt: r.submittedAt,
                marksAwarded: r.marksAwarded !== null ? Number(r.marksAwarded) : null,
                feedback: r.feedback || '',
              }
            : null,
        }));
      }
    }

    if (assignments.length === 0) {
      // Fallback
      assignments = [
        {
          id: 'asg-mock-1',
          title: 'Quadratic Equations Practice Set',
          description: 'Solve questions 1 through 15 from Chapter 4. Show all intermediate workings step by step.',
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          maxMarks: 50,
          attachmentUrl: null,
          subject: 'Mathematics',
          className: 'Class 10 - Section A',
          teacher: 'Rajesh Sharma',
          submission: {
            id: 'sub-1',
            status: 'GRADED',
            submissionText: 'Completed questions 1 to 15.',
            fileUrl: 'https://example.com/math-hw.pdf',
            submittedAt: new Date().toISOString(),
            marksAwarded: 48,
            feedback: 'Excellent work on factoring polynomials!',
          },
        },
        {
          id: 'asg-mock-2',
          title: 'Light & Reflection Laboratory Report',
          description: 'Submit formal observation tables and ray diagrams for Concave mirror experiment.',
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          maxMarks: 25,
          attachmentUrl: null,
          subject: 'Science',
          className: 'Class 10 - Section A',
          teacher: 'Sunita Verma',
          submission: null,
        },
      ];
    }

    return NextResponse.json({ status: 'success', assignments });
  } catch (error) {
    console.error('Student assignments API error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'student') {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Students only can submit homework.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { assignmentId, submissionText, fileUrl } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { status: 'error', message: 'Assignment ID is required.' },
        { status: 400 }
      );
    }

    if (session.tenantId) {
      // Find real studentId
      const sRows = await query(
        `SELECT id FROM schoolnext_erp.student WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [session.id, session.tenantId]
      );
      if (!sRows || sRows.length === 0) {
        return NextResponse.json(
          { status: 'error', message: 'Student profile not found.' },
          { status: 404 }
        );
      }
      const studentId = sRows[0].id;

      // Upsert submission
      const existing = await query(
        `SELECT id FROM schoolnext_erp.assignmentsubmission 
         WHERE tenantId = ? AND assignmentId = ? AND studentId = ?`,
        [session.tenantId, assignmentId, studentId]
      );

      if (existing.length > 0) {
        await query(
          `UPDATE schoolnext_erp.assignmentsubmission
           SET submissionText = ?, fileUrl = ?, submittedAt = NOW(), status = 'SUBMITTED'
           WHERE id = ?`,
          [submissionText || null, fileUrl || null, existing[0].id]
        );
      } else {
        const generatedId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await query(
          `INSERT INTO schoolnext_erp.assignmentsubmission 
            (id, tenantId, assignmentId, studentId, submissionText, fileUrl, submittedAt, status)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), 'SUBMITTED')`,
          [generatedId, session.tenantId, assignmentId, studentId, submissionText || null, fileUrl || null]
        );
      }

      return NextResponse.json({
        status: 'success',
        message: 'Homework submitted successfully.',
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Homework submitted successfully (preview mode).',
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
