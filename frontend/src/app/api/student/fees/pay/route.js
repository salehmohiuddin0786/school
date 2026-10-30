import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'student' && session.role !== 'parent')) {
      return NextResponse.json({ error: 'Unauthorized. Student or parent access only.' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentType = 'INSTALLMENT', amount, paymentMethod = 'ONLINE', invoiceId, studentId } = body;

    const targetStudentId = (session.role === 'parent' && studentId) ? studentId : session.id;
    const payAmount = Number(amount);

    if (!payAmount || payAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount greater than zero is required.' }, { status: 400 });
    }

    // 1. Check canonical schoolnext_erp invoice if tenantId is present
    if (session.tenantId && invoiceId && !invoiceId.startsWith('legacy-')) {
      const inv = await queryOne(
        `SELECT id, totalAmount, paidAmount, status FROM schoolnext_erp.invoice WHERE id = ? AND tenantId = ?`,
        [invoiceId, session.tenantId]
      );

      if (!inv) {
        return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
      }

      const total = Number(inv.totalAmount);
      const currentPaid = Number(inv.paidAmount);
      const currentBalance = total - currentPaid;

      if (currentBalance <= 0) {
        return NextResponse.json({ error: 'This invoice is already fully cleared. No outstanding balance.' }, { status: 400 });
      }

      if (payAmount > currentBalance) {
        return NextResponse.json(
          { error: `Overpayment Rejected: Requested payment ₹${payAmount} exceeds current outstanding balance ₹${currentBalance}.` },
          { status: 400 }
        );
      }

      const receiptNo = 'REC-' + Date.now().toString().slice(-8);
      const newPaid = currentPaid + payAmount;
      const newBalance = total - newPaid;
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      // Record payment matching canonical schema
      const paymentMethodEnum = paymentMethod === 'UPI' ? 'UPI' : 'ONLINE_GATEWAY';
      await query(
        `INSERT INTO schoolnext_erp.payment (id, tenantId, invoiceId, amount, paymentMethod, paymentStatus, transactionReference, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'SUCCESSFUL', ?, 'Self-service student portal settlement', NOW(), NOW())`,
        [receiptNo, session.tenantId, invoiceId, payAmount, paymentMethodEnum, `TXN-${Date.now()}`]
      );

      await query(
        `UPDATE schoolnext_erp.invoice SET paidAmount = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
        [newPaid, newStatus, invoiceId]
      );

      return NextResponse.json({
        status: 'success',
        message: 'Payment recorded and invoice balance updated successfully',
        receipt: {
          receipt_no: receiptNo,
          student_id: targetStudentId,
          amount_paid: payAmount,
          payment_type: paymentType,
          payment_method: paymentMethod,
          previous_balance: currentBalance,
          remaining_balance: newBalance,
          payment_date: new Date().toISOString(),
        },
      });
    }

    // 2. Process legacy _sms fee record
    const feeRow = await queryOne(
      `SELECT s_no, id, month, total, paid, balance FROM fee_record WHERE id = ? ORDER BY s_no DESC LIMIT 1`,
      [targetStudentId]
    );

    let feeRecordId = null;
    let currentTotal = 35000;
    let currentPaid = 0;
    let currentBalance = 35000;

    if (feeRow) {
      feeRecordId = feeRow.s_no;
      currentTotal = Number(feeRow.total || 0);
      currentPaid = Number(feeRow.paid || 0);
      currentBalance = Number(feeRow.balance || (currentTotal - currentPaid));
    } else {
      // Create initial fee record if missing
      await query(
        `INSERT INTO fee_record (id, month, other_collection, total, paid, balance, timestamp)
         VALUES (?, 'Academic Session 2026', 5000, 35000, 0, 35000, NOW())`,
        [targetStudentId]
      );
      const created = await queryOne('SELECT s_no FROM fee_record WHERE id = ? ORDER BY s_no DESC LIMIT 1', [targetStudentId]);
      feeRecordId = created?.s_no;
    }

    if (currentBalance <= 0) {
      return NextResponse.json({ error: 'Fees are already fully cleared. No balance due.' }, { status: 400 });
    }

    if (payAmount > currentBalance) {
      return NextResponse.json(
        { error: `Overpayment Rejected: Requested payment of ₹${payAmount} exceeds outstanding balance of ₹${currentBalance}.` },
        { status: 400 }
      );
    }

    const receiptNo = 'REC-' + Date.now().toString().slice(-8);
    const newPaid = currentPaid + payAmount;
    const remainingBalance = currentBalance - payAmount;

    // Record transaction
    await query(
      `INSERT INTO fee_payments 
       (receipt_no, student_id, fee_record_id, amount_paid, payment_type, payment_method, previous_balance, remaining_balance, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [receiptNo, targetStudentId, feeRecordId, payAmount, paymentType, paymentMethod, currentBalance, remainingBalance]
    );

    // Update fee_record
    await query(
      `UPDATE fee_record SET paid = ?, balance = ? WHERE s_no = ?`,
      [newPaid, remainingBalance, feeRecordId]
    );

    return NextResponse.json({
      status: 'success',
      message: 'Payment verified and cleared successfully',
      receipt: {
        receipt_no: receiptNo,
        student_id: targetStudentId,
        amount_paid: payAmount,
        payment_type: paymentType,
        payment_method: paymentMethod,
        previous_balance: currentBalance,
        remaining_balance: remainingBalance,
        payment_date: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Fees payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
