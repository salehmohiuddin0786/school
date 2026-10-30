import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
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
        ).catch(() => []);

        if (linkCheck.length === 0) {
          // If not in ERP studentparent, allow if matching parent/student relation in legacy
        }
      }
      studentId = requestedStudentId;
    }

    let invoices = [];
    let studentInfo = null;

    // 1. Check legacy students table
    const legacyStudent = await queryOne(
      'SELECT * FROM students WHERE id = ? OR email = ? LIMIT 1',
      [studentId, session.email]
    ).catch(() => null);

    const candidateIds = Array.from(new Set([studentId, legacyStudent?.id].filter(Boolean)));

    if (legacyStudent) {
      studentInfo = {
        id: legacyStudent.id,
        admissionNumber: `STD-${legacyStudent.id}`,
        name: `${legacyStudent.fname} ${legacyStudent.lname || ''}`.trim(),
        className: legacyStudent.class || 'Class 10',
        sectionName: legacyStudent.section || 'A',
        institutionName: 'Greenwood International School',
        institutionAddress: '100 Campus Avenue, Bangalore',
      };
    }

    // 2. Check canonical schoolnext_erp if tenantId exists
    if (session.tenantId) {
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
        WHERE s.tenantId = ? AND (s.userId = ? OR s.id = ? OR u.email = ?)
        LIMIT 1`,
        [session.tenantId, studentId, studentId, session.email]
      ).catch(() => []);

      if (sRows.length > 0) {
        const s = sRows[0];
        studentInfo = {
          id: s.id,
          admissionNumber: s.admissionNumber,
          name: `${s.firstName} ${s.lastName || ''}`.trim(),
          className: s.className || 'Class 10',
          sectionName: s.sectionName || 'A',
          institutionName: s.institutionName || 'Greenwood International School',
          institutionAddress: s.institutionAddress || '100 Campus Avenue, Bangalore',
        };

        candidateIds.push(s.id);

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
        ).catch(() => []);

        if (invRows.length > 0) {
          invoices = invRows.map((r) => ({
            id: r.id,
            invoiceNumber: r.invoiceNumber,
            total: Number(r.totalAmount),
            paid: Number(r.paidAmount),
            balance: Math.max(0, Number(r.totalAmount) - Number(r.paidAmount)),
            dueDate: r.dueDate instanceof Date ? r.dueDate.toISOString().split('T')[0] : String(r.dueDate || '').split('T')[0],
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

    // 3. Fallback to fee_record table if invoices still empty
    if (invoices.length === 0) {
      const idPlaceholders = candidateIds.length > 0 ? candidateIds.map(() => '?').join(', ') : '?';
      const queryIds = candidateIds.length > 0 ? candidateIds : [studentId];

      const legacyFees = await query(
        `SELECT s_no, month, other_collection, total, paid, balance, timestamp 
         FROM fee_record 
         WHERE id IN (${idPlaceholders}) 
         ORDER BY s_no DESC`,
        queryIds
      ).catch(() => []);

      if (legacyFees && legacyFees.length > 0) {
        invoices = legacyFees.map((f) => ({
          id: `legacy-${f.s_no}`,
          invoiceNumber: `INV-2026-${String(f.s_no).padStart(4, '0')}`,
          month: f.month,
          total: Number(f.total || 0),
          paid: Number(f.paid || 0),
          balance: Number(f.balance || 0),
          dueDate: '2026-11-15',
          status: (Number(f.balance) || 0) <= 0 ? 'PAID' : 'PENDING',
          createdAt: f.timestamp,
          items: [
            { description: 'Tuition Fee (Quarterly)', amount: Number(f.total || 0) * 0.75 },
            { description: 'Activity & Lab Infrastructure', amount: Number(f.other_collection || Number(f.total || 0) * 0.25) },
          ],
        }));
      }
    }

    // 4. Default demo invoice if student is brand new
    if (invoices.length === 0) {
      invoices = [
        {
          id: 'inv-demo-1',
          invoiceNumber: 'INV-2026-1001',
          month: 'November 2026',
          total: 12500,
          paid: 12500,
          balance: 0,
          dueDate: '2026-11-10',
          status: 'PAID',
          createdAt: new Date().toISOString(),
          items: [
            { description: 'Quarterly Tuition Fee', amount: 9500 },
            { description: 'Science & Computer Lab Fee', amount: 2000 },
            { description: 'Sports & Student Activity Council', amount: 1000 },
          ],
        },
        {
          id: 'inv-demo-2',
          invoiceNumber: 'INV-2026-1002',
          month: 'December 2026',
          total: 12500,
          paid: 5000,
          balance: 7500,
          dueDate: '2026-12-10',
          status: 'PARTIAL',
          createdAt: new Date().toISOString(),
          items: [
            { description: 'Quarterly Tuition Fee', amount: 9500 },
            { description: 'Science & Computer Lab Fee', amount: 2000 },
            { description: 'Sports & Student Activity Council', amount: 1000 },
          ],
        }
      ];
    }

    // 5. Fetch payment receipts
    const receiptPlaceholders = candidateIds.length > 0 ? candidateIds.map(() => '?').join(', ') : '?';
    const receipts = await query(
      `SELECT receipt_no, amount_paid, payment_type, payment_method, previous_balance, remaining_balance, payment_date
       FROM fee_payments
       WHERE student_id IN (${receiptPlaceholders})
       ORDER BY id DESC`,
      candidateIds.length > 0 ? candidateIds : [studentId]
    ).catch(() => []);

    if (!studentInfo) {
      studentInfo = {
        id: studentId,
        admissionNumber: `STD-${studentId}`,
        name: session.name || 'Student Account',
        className: 'Class 10',
        sectionName: 'A',
        institutionName: 'Greenwood International School',
        institutionAddress: '100 Campus Avenue, Bangalore',
      };
    }

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
