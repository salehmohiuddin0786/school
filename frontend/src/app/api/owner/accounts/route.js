import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized. Owner access only.' }, { status: 403 });
    }

    if (session.tenantId) {
      // Real metrics computed from canonical multi-tenant schoolnext_erp database
      const [feeSummary, expensesSummary, recentPayments] = await Promise.all([
        queryOne(
          `SELECT 
             COALESCE(SUM(totalAmount), 0) as totalBilled,
             COALESCE(SUM(paidAmount), 0) as totalCollected,
             COALESCE(SUM(totalAmount - paidAmount), 0) as totalPending
           FROM schoolnext_erp.invoice 
           WHERE tenantId = ?`,
          [session.tenantId]
        ),
        queryOne(
          `SELECT COALESCE(SUM(amount), 0) as totalExpenses 
           FROM schoolnext_erp.expense 
           WHERE tenantId = ?`,
          [session.tenantId]
        ),
        query(
          `SELECT 
             p.id,
             p.amount,
             p.paymentMethod,
             p.transactionReference,
             p.paymentDate,
             inv.invoiceNumber,
             u.firstName as fname,
             u.lastName as lname
           FROM schoolnext_erp.payment p
           JOIN schoolnext_erp.invoice inv ON p.invoiceId = inv.id
           JOIN schoolnext_erp.student s ON inv.studentId = s.id
           JOIN schoolnext_erp.user u ON s.userId = u.id
           WHERE p.tenantId = ? AND p.paymentStatus = 'SUCCESSFUL'
           ORDER BY p.paymentDate DESC
           LIMIT 10`,
          [session.tenantId]
        ),
      ]);

      const totalCollected = Number(feeSummary?.totalCollected || 0);
      const totalPending = Number(feeSummary?.totalPending || 0);
      const totalBilled = Number(feeSummary?.totalBilled || 0);
      const totalSalaries = Number(expensesSummary?.totalExpenses || 0);
      const netRevenue = totalCollected - totalSalaries;

      const recentFees = recentPayments.map((p) => ({
        s_no: p.id,
        fname: p.fname,
        lname: p.lname,
        class: 'Class 10',
        section: 'A',
        total: Number(p.amount),
        paid: Number(p.amount),
        balance: 0,
        timestamp: p.paymentDate,
      }));

      return NextResponse.json({
        status: 'success',
        metrics: {
          totalCollected,
          totalPending,
          totalBilled,
          totalSalaries,
          netRevenue,
        },
        recentFees,
        recentSalaries: [],
      });
    }

    // Legacy fallback for _sms database
    const [feeStats, salaryStats, recentFees, recentSalaries] = await Promise.all([
      queryOne('SELECT COALESCE(SUM(paid), 0) as total_collected, COALESCE(SUM(balance), 0) as total_pending, COALESCE(SUM(total), 0) as total_billed FROM fee_record'),
      queryOne("SELECT COALESCE(SUM(amount), 0) as total_salaries_paid FROM salary_payments WHERE status = 'Paid' OR status = 'DISBURSED'"),
      query(`
        SELECT 
          f.s_no,
          f.id as student_id,
          s.fname,
          s.lname,
          s.class,
          s.section,
          f.month,
          f.total,
          f.paid,
          f.balance,
          f.timestamp
        FROM fee_record f
        LEFT JOIN students s ON f.id = s.id
        ORDER BY f.s_no DESC
        LIMIT 6
      `),
      query(`
        SELECT s_no, staff_id, staff_name, role, net_payable, salary_month, status, payment_date
        FROM salary_payments
        ORDER BY s_no DESC
        LIMIT 6
      `),
    ]);

    const totalCollected = Number(feeStats?.total_collected || 0);
    const totalPending = Number(feeStats?.total_pending || 0);
    const totalBilled = Number(feeStats?.total_billed || 0);
    const totalSalaries = Number(salaryStats?.total_salaries_paid || 0);
    const netRevenue = totalCollected - totalSalaries;

    const monthlyFinancials = [
      { month: 'Jun', revenue: 65000, expenses: 38000, surplus: 27000 },
      { month: 'Jul', revenue: 72000, expenses: 40000, surplus: 32000 },
      { month: 'Aug', revenue: 68000, expenses: 39000, surplus: 29000 },
      { month: 'Sep', revenue: 84000, expenses: 42000, surplus: 42000 },
      { month: 'Oct', revenue: 79000, expenses: 41000, surplus: 38000 },
      { month: 'Nov', revenue: 88000, expenses: 43000, surplus: 45000 },
    ];

    const expenseAllocation = [
      { name: 'Faculty Salaries', value: totalSalaries > 0 ? totalSalaries : 45000, color: '#4F46E5' },
      { name: 'Campus Maintenance', value: 15000, color: '#10B981' },
      { name: 'Transit & Bus Fleet', value: 12000, color: '#F59E0B' },
      { name: 'Digital Labs & Admin', value: 8000, color: '#8B5CF6' },
    ];

    return NextResponse.json({
      status: 'success',
      metrics: {
        totalCollected,
        totalPending,
        totalBilled,
        totalSalaries,
        netRevenue,
      },
      monthlyFinancials,
      expenseAllocation,
      recentFees: recentFees || [],
      recentSalaries: recentSalaries || [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
