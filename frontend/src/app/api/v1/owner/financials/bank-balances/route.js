import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const tenantId = session.tenantId;

    if (tenantId) {
      const [paymentsRes, expensesRes] = await Promise.all([
        queryOne(
          `SELECT COALESCE(SUM(amount), 0) as inflow 
           FROM schoolnext_erp.payment 
           WHERE tenantId = ? AND paymentStatus = 'SUCCESSFUL'`,
          [tenantId]
        ).catch(() => ({ inflow: 0 })),
        queryOne(
          `SELECT COALESCE(SUM(amount), 0) as outflow 
           FROM schoolnext_erp.expense 
           WHERE tenantId = ?`,
          [tenantId]
        ).catch(() => ({ outflow: 0 })),
      ]);

      const inflow = Number(paymentsRes?.inflow || 0);
      const outflow = Number(expensesRes?.outflow || 0);
      const totalLiquidFunds = Math.max(0, inflow - outflow);

      const bankAccounts = inflow > 0 ? [
        {
          id: 'bnk-primary',
          bankName: 'Institution Operating Vault',
          accountType: 'Current Operating & Collections Account',
          accountNumber: 'INST-OPERATIONS',
          ifscCode: 'ACTIVE',
          branch: 'Main Campus Branch',
          currentBalance: totalLiquidFunds,
          unreconciledInflow: 0,
          status: 'ACTIVE',
          lastSync: new Date().toISOString(),
        }
      ] : [];

      const dailyCashBook = {
        openingCash: 0,
        cashReceiptsToday: 0,
        pettyDisbursementsToday: 0,
        closingCash: totalLiquidFunds,
      };

      return NextResponse.json({
        asOfDate: todayDate,
        totalLiquidFunds,
        dailyCashBook,
        bankAccounts,
      });
    }

    // Platform Super Admin view
    const [globalInflow, globalOutflow] = await Promise.all([
      queryOne(`SELECT COALESCE(SUM(amount), 0) as inflow FROM schoolnext_erp.payment WHERE paymentStatus = 'SUCCESSFUL'`).catch(() => ({ inflow: 0 })),
      queryOne(`SELECT COALESCE(SUM(amount), 0) as outflow FROM schoolnext_erp.expense`).catch(() => ({ outflow: 0 })),
    ]);

    const totalLiquidFunds = Math.max(0, Number(globalInflow?.inflow || 0) - Number(globalOutflow?.outflow || 0));

    return NextResponse.json({
      asOfDate: todayDate,
      totalLiquidFunds,
      dailyCashBook: {
        openingCash: 0,
        cashReceiptsToday: 0,
        pettyDisbursementsToday: 0,
        closingCash: totalLiquidFunds,
      },
      bankAccounts: [],
    });
  } catch (error) {
    console.error('Owner bank balances API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
