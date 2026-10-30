import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const monthDate = `${targetMonth}-01`;

    // 1. Get all staff/teachers
    const staffList = await query(`
      SELECT 
        t.id as staff_id,
        t.fname,
        t.lname,
        t.subject,
        t.email,
        COALESCE(sss.basic_salary, 25000) as basic_salary,
        COALESCE(sss.allowances, 10000) as allowances,
        COALESCE(sss.deductions, 2000) as deductions,
        COALESCE(sss.monthly_salary, 35000) as monthly_salary,
        sss.effective_date,
        sss.joining_date,
        COALESCE(sss.employment_status, 'ACTIVE') as employment_status
      FROM teachers t
      LEFT JOIN staff_salary_settings sss 
        ON t.id = sss.staff_id
      ORDER BY t.fname ASC
    `);

    // 2. Days in month
    const [yearStr, mStr] = targetMonth.split('-');
    const workingDays = new Date(parseInt(yearStr, 10), parseInt(mStr, 10), 0).getDate();

    // 3. For each staff member, check existing salary_payments row or compute attendance-based payroll
    const payrollRecords = [];

    for (const staff of staffList) {
      const staffName = `${staff.fname} ${staff.lname || ''}`.trim();

      // Check if already calculated in salary_payments
      const existingPayment = await queryOne(
        `SELECT * FROM salary_payments WHERE staff_id = ? AND DATE_FORMAT(salary_month, '%Y-%m') = ?`,
        [staff.staff_id, targetMonth]
      );

      if (existingPayment) {
        payrollRecords.push({
          s_no: existingPayment.s_no,
          staff_id: staff.staff_id,
          staff_name: staffName,
          subject: staff.subject,
          email: staff.email,
          basic_salary: Number(existingPayment.basic_salary || staff.basic_salary),
          allowances: Number(existingPayment.allowances || staff.allowances),
          deductions: Number(existingPayment.deductions || staff.deductions),
          working_days: existingPayment.working_days,
          attendance_days: existingPayment.attendance_days,
          leave_days: existingPayment.leave_days,
          approved_leave_days: existingPayment.approved_leave_days,
          payable_days: Number(existingPayment.attendance_days) + Number(existingPayment.approved_leave_days),
          lop_days: Number(existingPayment.lop_days),
          total_deduction: Number(existingPayment.total_deduction),
          net_payable: Number(existingPayment.net_payable),
          status: existingPayment.status,
          payment_date: existingPayment.payment_date,
          payment_method: existingPayment.payment_method || 'BANK_TRANSFER',
          salary_month: targetMonth,
        });
      } else {
        // Compute attendance from teacher_attendence
        const attendanceRows = await query(
          `SELECT attendence, COUNT(*) as cnt 
           FROM teacher_attendence 
           WHERE teacher_id = ? AND DATE_FORMAT(date, '%Y-%m') = ? 
           GROUP BY attendence`,
          [staff.staff_id, targetMonth]
        );

        let presentDays = 0;
        let halfDays = 0;
        let paidLeaves = 0;
        let unpaidLeaves = 0;

        for (const row of attendanceRows) {
          if (row.attendence === 'PRESENT') presentDays += row.cnt;
          else if (row.attendence === 'HALF_DAY') halfDays += row.cnt;
          else if (row.attendence === 'PAID_LEAVE') paidLeaves += row.cnt;
          else if (row.attendence === 'UNPAID_LEAVE' || row.attendence === 'ABSENT') unpaidLeaves += row.cnt;
        }

        // Payable days calculation
        // If no attendance marked at all yet for this month, default to full working days for calculation preview
        const hasAttendance = attendanceRows.length > 0;
        const calcPayable = hasAttendance ? (presentDays + (halfDays * 0.5) + paidLeaves) : workingDays;
        const lopDays = Math.max(0, workingDays - calcPayable);

        const basic = Number(staff.basic_salary);
        const allow = Number(staff.allowances);
        const deduct = Number(staff.deductions);

        // Formula: basic * (payableDays / workingDays) + allowances - deductions
        const earnedBasic = Math.round(basic * (calcPayable / workingDays));
        const netPayable = Math.max(0, earnedBasic + allow - deduct);

        payrollRecords.push({
          staff_id: staff.staff_id,
          staff_name: staffName,
          subject: staff.subject,
          email: staff.email,
          basic_salary: basic,
          allowances: allow,
          deductions: deduct,
          working_days: workingDays,
          attendance_days: presentDays + (halfDays * 0.5),
          leave_days: unpaidLeaves,
          approved_leave_days: paidLeaves,
          payable_days: calcPayable,
          lop_days: lopDays,
          total_deduction: deduct + (basic - earnedBasic),
          net_payable: netPayable,
          status: 'DRAFT',
          payment_date: null,
          payment_method: 'BANK_TRANSFER',
          salary_month: targetMonth,
        });
      }
    }

    // Totals summary
    const totalPayroll = payrollRecords.reduce((acc, r) => acc + (r.net_payable || 0), 0);
    const approvedCount = payrollRecords.filter(r => r.status === 'APPROVED' || r.status === 'DISBURSED').length;
    const disbursedCount = payrollRecords.filter(r => r.status === 'DISBURSED').length;

    return NextResponse.json({
      status: 'success',
      month: targetMonth,
      working_days: workingDays,
      records: payrollRecords,
      summary: {
        total_staff: payrollRecords.length,
        total_payroll: totalPayroll,
        approved_count: approvedCount,
        disbursed_count: disbursedCount,
      },
    });
  } catch (error) {
    console.error('Owner salaries GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, month, staff_id, status, payment_method = 'BANK_TRANSFER', remarks } = body;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const salaryMonthDate = `${targetMonth}-01`;

    if (action === 'approve_all' || action === 'approve_single') {
      let targetStaff = [];
      if (action === 'approve_single') {
        if (!staff_id) return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
        targetStaff = [staff_id];
      } else {
        const allStaff = await query('SELECT id FROM teachers');
        targetStaff = allStaff.map(t => t.id);
      }

      for (const sId of targetStaff) {
        // Query salary settings
        const staff = await queryOne(`
          SELECT t.id, t.fname, t.lname, sss.basic_salary, sss.allowances, sss.deductions 
          FROM teachers t 
          LEFT JOIN staff_salary_settings sss ON t.id = sss.staff_id
          WHERE t.id = ?
        `, [sId]);

        if (!staff) continue;

        const staffName = `${staff.fname} ${staff.lname || ''}`.trim();
        const basic = Number(staff.basic_salary || 25000);
        const allow = Number(staff.allowances || 10000);
        const deduct = Number(staff.deductions || 2000);
        const net = basic + allow - deduct;

        await query(
          `INSERT INTO salary_payments 
           (staff_id, staff_name, role, monthly_salary, basic_salary, allowances, deductions, working_days, attendance_days, leave_days, approved_leave_days, leave_balance, lop_days, total_deduction, net_payable, salary_month, status, payment_method, remarks, amount, created_at)
           VALUES (?, ?, 'teacher', ?, ?, ?, ?, 30, 26, 0, 4, 10, 0, ?, ?, ?, 'APPROVED', ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE 
             status = 'APPROVED',
             payment_method = VALUES(payment_method),
             remarks = VALUES(remarks)`,
          [sId, staffName, net, basic, allow, deduct, deduct, net, salaryMonthDate, payment_method, remarks || 'Approved by Executive Owner', net]
        );
      }

      return NextResponse.json({
        status: 'success',
        message: action === 'approve_single' ? `Payroll approved for staff member ${staff_id}` : `All payroll records for ${targetMonth} approved successfully`,
      });
    }

    if (action === 'disburse_single' || action === 'disburse_all') {
      let targetStaff = [];
      if (action === 'disburse_single') {
        if (!staff_id) return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
        targetStaff = [staff_id];
      } else {
        const allStaff = await query('SELECT id FROM teachers');
        targetStaff = allStaff.map(t => t.id);
      }

      const today = new Date().toISOString().split('T')[0];

      for (const sId of targetStaff) {
        await query(
          `UPDATE salary_payments 
           SET status = 'DISBURSED', payment_date = ?, payment_method = ?
           WHERE staff_id = ? AND DATE_FORMAT(salary_month, '%Y-%m') = ?`,
          [today, payment_method, sId, targetMonth]
        );
      }

      return NextResponse.json({
        status: 'success',
        message: action === 'disburse_single' ? `Salary disbursed for ${staff_id}` : `Payroll disbursement completed for ${targetMonth}`,
      });
    }

    return NextResponse.json({ error: 'Invalid payroll action' }, { status: 400 });
  } catch (error) {
    console.error('Owner salaries POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
