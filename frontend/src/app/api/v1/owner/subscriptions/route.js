import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const isPlatformOwner = Boolean(session.isPlatformOwner || !session.tenantId || session.isSuperAdmin === 1 || session.roleCode === 'SUPER_ADMIN');

    // 1. All available plans
    const plans = await query(`
      SELECT 
        id,
        code,
        name,
        tier,
        description,
        price,
        currencyCode,
        billingCycle,
        maxStudents,
        maxStaff,
        maxCampuses,
        features,
        isActive,
        createdAt
      FROM schoolnext_erp.subscriptionplan
      ORDER BY price ASC
    `).catch(() => []);

    // 2. Active subscriptions across institutions (strictly tenant isolated for Institution Owner)
    let subsSql = `
      SELECT 
        s.id,
        s.tenantId,
        s.status,
        s.currentPeriodStart,
        s.currentPeriodEnd,
        s.trialEndsAt,
        t.name as institutionName,
        t.code as institutionCode,
        t.type as institutionType,
        sp.name as planName,
        sp.code as planCode,
        sp.price as planPrice,
        sp.billingCycle
      FROM schoolnext_erp.subscription s
      JOIN schoolnext_erp.tenant t ON s.tenantId = t.id
      JOIN schoolnext_erp.subscriptionplan sp ON s.planId = sp.id
    `;
    let queryParams = [];
    if (!isPlatformOwner && session.tenantId) {
      subsSql += ' WHERE s.tenantId = ?';
      queryParams.push(session.tenantId);
    }
    subsSql += ' ORDER BY s.currentPeriodEnd ASC';

    const subscriptions = await query(subsSql, queryParams).catch(() => []);

    const totalMrr = subscriptions
      .filter(s => s.status === 'ACTIVE')
      .reduce((acc, s) => acc + Number(s.planPrice || 0), 0);

    return NextResponse.json({
      status: 'success',
      plans,
      subscriptions,
      metrics: {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'ACTIVE').length,
        trialSubscriptions: subscriptions.filter(s => s.status === 'TRIALING').length,
        totalMrr,
      },
    });
  } catch (error) {
    console.error('Subscription management API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
