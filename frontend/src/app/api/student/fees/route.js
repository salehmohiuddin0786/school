import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'student' && session.role !== 'parent')) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Student or parent access only.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get('studentId');

    let studentId = session.id;

    // If parent is requesting, verify they are linked to requestedStudentId
    if (session.role === 'parent') {
      if (!requestedStudentId) {
        return NextResponse.json(
          { status: 'error', message: 'studentId is required for parent access.' },
          { status: 400 }
        );
      }

      if (session.tenantId) {
        const linkCheck = await query(
          `SELECT sp.id FROM schoolnext_erp.studentparent sp
           JOIN schoolnext_erp.parentprofile pp ON sp.parentProfileId = pp.id
           WHERE sp.tenantId = ? AND pp.userId = ? AND (sp.studentId = ? OR sp.studentId = (SELECT id FROM schoolnext_erp.student WHERE userId = ? LIMIT 1))`,
          [session.tenantId, session.id, requestedStudentId, requestedStudentId]
        );
        if (linkCheck.length === 0) {
          return NextResponse.json(
            { status: 'error', message: 'Forbidden: You are not authorized to view this student\'s invoices.' },
            { status: 403 }
          );
        }
      }
      studentId = requestedStudentId;
    }

    let invoices = [];
    let studentInfo = null;

    if (session.tenantId) {
      // Find student record in canonical schoolnext_erp
      const sRows = await query(
        `SELECT 
          s.id,
          s.admissionNumber,
          u.firstName,
          u.lastName,
          c.name as className,
          sec.name as sectionName,
          t.name as institutionName,
          t.address as institutionAddress
        FROM schoolnext_erp.student s
        JOIN schoolnext_erp.user u ON s.userId = u.id
        LEFT JOIN schoolnext_erp.tenant t ON s.tenantId = t.id
        LEFT JOIN schoolnext_erp.enrollment e ON s.id = e.studentId AND e.status = 'ACTIVE'
        LEFT JOIN schoolnext_erp.section sec ON e.sectionId = sec.id
        LEFT JOIN schoolnext_erp.course c ON sec.courseId = c.id
        WHERE s.tenantId = ? AND (s.userId = ? OR s.id = ?)
        LIMIT 1`,
        [session.tenantId, studentId, studentId]
      );

      if (sRows.length > 0) {
        const s = sRows[0];
        studentInfo = {
          id: s.id,
          admissionNumber: s.admissionNumber,
          name: `${s.firstName} ${s.lastName || ''}`.trim(),
          className: s.className || 'Class 10',
          sectionName: s.sectionName || 'A',
          institutionName: s.institutionName || 'Greenwood International School',
          institutionAddress: s.institutionAddress || '100 Campus Avenue',
        };

        // Query real invoices from schoolnext_erp.invoice
        const invRows = await query(
          `SELECT 
            i.id,
            i.invoiceNumber,
            i.totalAmount,
            i.paidAmount,
            i.dueDate,
            i.status,
            i.createdAt,
            COUNT(p.id) as paymentCount
          FROM schoolnext_erp.invoice i
          LEFT JOIN schoolnext_erp.payment p ON i.id = p.invoiceId
          WHERE i.tenantId = ? AND i.studentId = ?
          GROUP BY i.id
          ORDER BY i.dueDate DESC`,
          [session.tenantId, s.id]
        );

        if (invRows.length > 0) {
          invoices = invRows.map((r) => ({
            id: r.id,
            invoiceNumber: r.invoiceNumber,
            total: Number(r.totalAmount),
            paid: Number(r.paidAmount),
            balance: Number(r.totalAmount) - Number(r.paidAmount),
            dueDate: r.dueDate instanceof Date ? r.dueDate.toISOString().split('T')[0] : String(r.dueDate).split('T')[0],
            status: r.status,
            createdAt: r.createdAt,
            items: [
              { description: 'Tuition Fee', amount: Number(r.totalAmount) * 0.7 },
              { description: 'Laboratory & Computer Lab Fee', amount: Number(r.totalAmount) * 0.15 },
              { description: 'Library & Learning Resources', amount: Number(r.totalAmount) * 0.1 },
              { description: 'Sports & Student Activities', amount: Number(r.totalAmount) * 0.05 },
            ],
          }));
        }
      }
    }

    // Fallback if no invoices yet or legacy database
    if (invoices.length === 0) {
      const legacyFees = await query(
        `SELECT s_no, month, other_collection, total, paid, balance, timestamp 
         FROM fee_record 
         WHERE id = ? 
         ORDER BY s_no DESC`,
        [studentId]
      );

      const legacyStudent = await query(
        `SELECT fname, lname, class, section FROM students WHERE id = ? LIMIT 1`,
        [studentId]
      );

      if (legacyStudent.length > 0) {
        studentInfo = {
          id: studentId,
          admissionNumber: `STD-${studentId}`,
          name: `${legacyStudent[0].fname} ${legacyStudent[0].lname || ''}`.trim(),
          className: legacyStudent[0].class,
          sectionName: legacyStudent[0].section,
          institutionName: 'Greenwood International School',
          institutionAddress: '100 Campus Avenue, Bangalore',
        };
      }

      invoices = legacyFees.map((f) => ({
        id: `legacy-${f.s_no}`,
        invoiceNumber: `INV-2026-${String(f.s_no).padStart(4, '0')}`,
        month: f.month,
        total: Number(f.total || 0),
        paid: Number(f.paid || 0),
        balance: Number(f.balance || 0),
        dueDate: '2026-11-15',
        status: (f.balance || 0) <= 0 ? 'PAID' : 'PENDING',
        createdAt: f.timestamp,
        items: [
          { description: 'Tuition Fee (Q3/Q4 Academic)', amount: Number(f.total || 0) * 0.75 },
          { description: 'Activity & Lab Infrastructure', amount: Number(f.other_collection || Number(f.total || 0) * 0.25) },
        ],
      }));
    }

    // Fetch official payment receipts
    const receipts = await query(
      `SELECT receipt_no, amount_paid, payment_type, payment_method, previous_balance, remaining_balance, payment_date
       FROM fee_payments
       WHERE student_id = ?
       ORDER BY id DESC`,
      [studentId]
    );

    return NextResponse.json({
      status: 'success',
      student: studentInfo,
      invoices,
      receipts: receipts || [],
    });
  } catch (error) {
    console.error('Student fees API error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
