import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [feeStats, salaryStats, recentFees, recentSalaries] = await Promise.all([
      queryOne('SELECT SUM(paid) as total_collected, SUM(balance) as total_pending, SUM(total) as total_billed FROM fee_record'),
      queryOne("SELECT SUM(amount) as total_salaries_paid FROM salary_payments WHERE status = 'Paid'"),
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
        LEFT JOIN students s ON CONVERT(f.id USING utf8mb4) = CONVERT(s.id USING utf8mb4)
        ORDER BY f.s_no DESC
        LIMIT 10
      `),
      query(`
        SELECT 
          s_no,
          staff_id,
          staff_name,
          role,
          amount,
          status,
          payment_date,
          created_at
        FROM salary_payments
        ORDER BY s_no DESC
        LIMIT 10
      `),
    ]);

    const totalCollected = Number(feeStats?.total_collected || 0);
    const totalPending = Number(feeStats?.total_pending || 0);
    const totalBilled = Number(feeStats?.total_billed || 0);
    const totalSalaries = Number(salaryStats?.total_salaries_paid || 0);
    const netRevenue = totalCollected - totalSalaries;

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
      recentSalaries,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
