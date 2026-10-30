import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Teacher portal access only.' },
        { status: 403 }
      );
    }

    const { id: assignmentId } = await params;

    let submissions = [];

    if (session.tenantId) {
      const rows = await query(
        `SELECT 
          asub.id,
          asub.status,
          asub.submissionText,
          asub.fileUrl,
          asub.submittedAt,
          asub.marksAwarded,
          asub.feedback,
          s.admissionNumber,
          u.firstName as studentFname,
          u.lastName as studentLname
        FROM schoolnext_erp.assignmentsubmission asub
        JOIN schoolnext_erp.student s ON asub.studentId = s.id
        JOIN schoolnext_erp.user u ON s.userId = u.id
        WHERE asub.tenantId = ? AND asub.assignmentId = ?
        ORDER BY asub.submittedAt DESC`,
        [session.tenantId, assignmentId]
      );

      submissions = rows.map((r) => ({
        id: r.id,
        status: r.status,
        submissionText: r.submissionText,
        fileUrl: r.fileUrl,
        submittedAt: r.submittedAt,
        marksAwarded: r.marksAwarded !== null ? Number(r.marksAwarded) : null,
        feedback: r.feedback || '',
        studentName: `${r.studentFname} ${r.studentLname || ''}`.trim(),
        admissionNumber: r.admissionNumber,
      }));
    } else {
      submissions = [
        {
          id: 'sub-1',
          status: 'SUBMITTED',
          submissionText: 'All equations solved with step-by-step factoring.',
          fileUrl: 'https://example.com/homework1.pdf',
          submittedAt: new Date().toISOString(),
          marksAwarded: null,
          feedback: '',
          studentName: 'Aarav Sharma',
          admissionNumber: 'STD-101',
        },
      ];
    }

    return NextResponse.json({ status: 'success', submissions });
  } catch (error) {
    console.error('List submissions error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Teacher portal access only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { submissionId, marksAwarded, feedback } = body;

    if (!submissionId) {
      return NextResponse.json(
        { status: 'error', message: 'Submission ID is required.' },
        { status: 400 }
      );
    }

    if (session.tenantId) {
      await query(
        `UPDATE schoolnext_erp.assignmentsubmission
         SET marksAwarded = ?, feedback = ?, status = 'GRADED', gradedAt = NOW(), gradedByUserId = ?
         WHERE id = ? AND tenantId = ?`,
        [Number(marksAwarded), feedback || '', session.id, submissionId, session.tenantId]
      );
    }

    return NextResponse.json({ status: 'success', message: 'Submission graded successfully.' });
  } catch (error) {
    console.error('Grade submission error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
