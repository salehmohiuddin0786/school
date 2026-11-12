import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

// POST: Change Subscription for Institution
export async function POST(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Platform Owner access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { planId, billingCycle = 'MONTHLY', extendMonths = 12, status = 'ACTIVE' } = body;

    if (!planId) {
      return NextResponse.json({ error: 'planId is required.' }, { status: 400 });
    }

    const tenant = await queryOne('SELECT id, name FROM schoolnext_erp.tenant WHERE id = ?', [id]).catch(() => null);
    if (!tenant) {
      return NextResponse.json({ error: `Institution with ID '${id}' not found.` }, { status: 404 });
    }

    const plan = await queryOne('SELECT id, name, price FROM schoolnext_erp.subscriptionplan WHERE id = ? OR code = ?', [planId, planId]).catch(() => null);
    if (!plan) {
      return NextResponse.json({ error: `Subscription Plan with ID or Code '${planId}' not found.` }, { status: 404 });
    }

    // Check existing subscription
    const existingSub = await queryOne('SELECT id FROM schoolnext_erp.subscription WHERE tenantId = ? AND status = "ACTIVE" LIMIT 1', [id]).catch(() => null);

    const now = new Date();
    const currentPeriodEnd = new Date(now.getTime() + (Number(extendMonths) || 12) * 30 * 24 * 60 * 60 * 1000);

    if (existingSub) {
      await query(`
        UPDATE schoolnext_erp.subscription
        SET planId = ?, status = ?, currentPeriodStart = NOW(), currentPeriodEnd = ?, updatedAt = NOW()
        WHERE id = ?
      `, [plan.id, status, currentPeriodEnd, existingSub.id]);
    } else {
      await query(`
        INSERT INTO schoolnext_erp.subscription (
          id, tenantId, planId, status, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, NOW(), ?, NOW(), NOW())
      `, [crypto.randomUUID(), id, plan.id, status, currentPeriodEnd]);
    }

    // Audit log
    await query(`
      INSERT INTO schoolnext_erp.auditlog (
        id, tenantId, userId, action, entityType, entityId, newValues, createdAt
      ) VALUES (?, ?, ?, 'SUBSCRIPTION_CHANGE', 'TENANT', ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      id,
      session.id,
      id,
      JSON.stringify({ planName: plan.name, extendMonths, periodEnd: currentPeriodEnd }),
    ]).catch(() => {});

    return NextResponse.json({
      status: 'success',
      success: true,
      message: `Subscription for '${tenant.name}' upgraded to '${plan.name}' active until ${currentPeriodEnd.toISOString().split('T')[0]}.`,
      planName: plan.name,
      expiryDate: currentPeriodEnd.toISOString().split('T')[0],
      subscription: {
        planName: plan.name,
        expiryDate: currentPeriodEnd.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Update subscription API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
