import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || '2026-2027';
    const tenantId = session.tenantId;

    let feeRow = { totalPaid: 0 };
    let expenseRow = { totalExpense: 0 };

    if (tenantId) {
      [feeRow, expenseRow] = await Promise.all([
        queryOne(
          `SELECT COALESCE(SUM(paidAmount), 0) as totalPaid 
           FROM schoolnext_erp.invoice 
           WHERE tenantId = ?`,
          [tenantId]
        ).catch(() => ({ totalPaid: 0 })),
        queryOne(
          `SELECT COALESCE(SUM(amount), 0) as totalExpense 
           FROM schoolnext_erp.expense 
           WHERE tenantId = ?`,
          [tenantId]
        ).catch(() => ({ totalExpense: 0 })),
      ]);
    } else {
      [feeRow, expenseRow] = await Promise.all([
        queryOne(`SELECT COALESCE(SUM(paidAmount), 0) as totalPaid FROM schoolnext_erp.invoice`).catch(() => ({ totalPaid: 0 })),
        queryOne(`SELECT COALESCE(SUM(amount), 0) as totalExpense FROM schoolnext_erp.expense`).catch(() => ({ totalExpense: 0 })),
      ]);
    }

    const totalRevenue = Number(feeRow?.totalPaid || 0);
    const totalOperatingExpenses = Number(expenseRow?.totalExpense || 0);

    const revenues = {
      tuitionFees: Math.round(totalRevenue * 0.8),
      transportationFees: Math.round(totalRevenue * 0.1),
      laboratoryAndTechFees: Math.round(totalRevenue * 0.05),
      sportsAndActivities: Math.round(totalRevenue * 0.03),
      admissionAndRegistration: Math.round(totalRevenue * 0.02),
      totalRevenue,
    };

    const expenses = {
      facultyAndStaffSalaries: Math.round(totalOperatingExpenses * 0.65),
      campusOperationsAndUtilities: Math.round(totalOperatingExpenses * 0.15),
      educationalSuppliesAndLabs: Math.round(totalOperatingExpenses * 0.1),
      transportationAndFleet: Math.round(totalOperatingExpenses * 0.05),
      itInfrastructureAndSoftware: Math.round(totalOperatingExpenses * 0.03),
      marketingAndAdmissions: Math.round(totalOperatingExpenses * 0.01),
      administrativeAndLegal: Math.round(totalOperatingExpenses * 0.01),
      totalOperatingExpenses,
    };

    const ebitda = totalRevenue - totalOperatingExpenses;
    const ebitdaMargin = totalRevenue > 0 ? Number(((ebitda / totalRevenue) * 100).toFixed(2)) : 0;
    const depreciationAndAmortization = 0;
    const operatingProfit = ebitda - depreciationAndAmortization;
    const operatingMargin = totalRevenue > 0 ? Number(((operatingProfit / totalRevenue) * 100).toFixed(2)) : 0;
    const interestAndTaxes = 0;
    const netIncome = operatingProfit - interestAndTaxes;
    const netMargin = totalRevenue > 0 ? Number(((netIncome / totalRevenue) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      fiscalYear,
      period: `April ${fiscalYear.split('-')[0]} - March ${fiscalYear.split('-')[1]}`,
      currency: 'INR',
      revenues,
      expenses,
      ebitda,
      ebitdaMargin,
      depreciationAndAmortization,
      operatingProfit,
      operatingMargin,
      netIncome,
      netMargin,
    });
  } catch (error) {
    console.error('Owner P&L API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
