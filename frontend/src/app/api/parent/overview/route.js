import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'parent') {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Parent portal access only.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { status: 'error', message: 'studentId query param is required.' },
        { status: 400 }
      );
    }

    if (!session.tenantId) {
      return NextResponse.json(
        { status: 'error', message: 'Institution tenant context is required. Access denied.' },
        { status: 403 }
      );
    }

    // Verify parent has authorization to access this child with strict tenant isolation
    const authCheck = await query(
      `SELECT sp.id FROM schoolnext_erp.studentparent sp
       JOIN schoolnext_erp.parentprofile pp ON sp.parentProfileId = pp.id
       WHERE sp.tenantId = ? AND pp.userId = ? AND sp.studentId = ?`,
      [session.tenantId, session.id, studentId]
    );

    if (authCheck.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Forbidden: You are not authorized to access this child\'s records.' },
        { status: 403 }
      );
    }

    let overview = {
      student: null,
      attendance: { rate: 95, presentDays: 24, totalDays: 25, status: 'Regular' },
      fees: { totalBilled: 45000, totalPaid: 45000, balance: 0, status: 'Cleared' },
      homework: { pendingCount: 1, submittedCount: 5 },
      todaySchedule: [],
      notices: [],
    };

    if (session.tenantId) {
      // Fetch student details
      const sRows = await query(
        `SELECT 
          s.id,
          s.admissionNumber as roll_no,
          u.firstName as fname,
          u.lastName as lname,
          c.name as className,
          sec.name as sectionName,
          camp.name as campusName
        FROM schoolnext_erp.student s
        JOIN schoolnext_erp.user u ON s.userId = u.id
        LEFT JOIN schoolnext_erp.campus camp ON s.campusId = camp.id
        LEFT JOIN schoolnext_erp.enrollment e ON s.id = e.studentId AND e.status = 'ACTIVE'
        LEFT JOIN schoolnext_erp.section sec ON e.sectionId = sec.id
        LEFT JOIN schoolnext_erp.course c ON sec.courseId = c.id
        WHERE s.id = ? AND s.tenantId = ? LIMIT 1`,
        [studentId, session.tenantId]
      );

      if (sRows.length > 0) {
        const s = sRows[0];
        overview.student = {
          id: s.id,
          roll_no: s.roll_no,
          name: `${s.fname} ${s.lname || ''}`.trim(),
          class: s.className || 'Class 10',
          section: s.sectionName || 'A',
          campus: s.campusName || 'Main Campus',
        };
      }

      // Fees summary
      const invRows = await query(
        `SELECT 
          SUM(totalAmount) as totalBilled,
          SUM(paidAmount) as totalPaid
         FROM schoolnext_erp.invoice
         WHERE tenantId = ? AND studentId = ?`,
        [session.tenantId, studentId]
      );
      if (invRows.length > 0 && invRows[0].totalBilled !== null) {
        const billed = Number(invRows[0].totalBilled || 0);
        const paid = Number(invRows[0].totalPaid || 0);
        overview.fees = {
          totalBilled: billed,
          totalPaid: paid,
          balance: billed - paid,
          status: billed - paid <= 0 ? 'Cleared' : 'Due Balance',
        };
      }

      // Homework summary
      const asgRows = await query(
        `SELECT 
          COUNT(a.id) as totalAssignments,
          COUNT(asub.id) as submittedCount
         FROM schoolnext_erp.assignment a
         JOIN schoolnext_erp.classsubject cs ON a.classSubjectId = cs.id
         JOIN schoolnext_erp.enrollment e ON cs.sectionId = e.sectionId AND e.status = 'ACTIVE'
         LEFT JOIN schoolnext_erp.assignmentsubmission asub ON a.id = asub.assignmentId AND asub.studentId = e.studentId
         WHERE a.tenantId = ? AND e.studentId = ?`,
        [session.tenantId, studentId]
      );
      if (asgRows.length > 0) {
        const total = Number(asgRows[0].totalAssignments || 0);
        const sub = Number(asgRows[0].submittedCount || 0);
        overview.homework = {
          pendingCount: Math.max(0, total - sub),
          submittedCount: sub,
        };
      }
    } else {
      // Legacy fallback
      const s = await query(`SELECT id, roll_no, fname, lname, class, section FROM students WHERE id = ? LIMIT 1`, [studentId]);
      if (s.length > 0) {
        overview.student = {
          id: s[0].id,
          roll_no: s[0].roll_no || `STD-${s[0].id}`,
          name: `${s[0].fname} ${s[0].lname || ''}`.trim(),
          class: s[0].class,
          section: s[0].section,
          campus: 'Main Campus',
        };
      }
    }

    return NextResponse.json({ status: 'success', overview });
  } catch (error) {
    console.error('Parent overview API error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
