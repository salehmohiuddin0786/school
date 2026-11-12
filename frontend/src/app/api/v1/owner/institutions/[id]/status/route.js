import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

// PATCH: Change Institution Status (Activate, Suspend, Archive)
export async function PATCH(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Platform Owner access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, reason } = body;

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'ARCHIVED', 'TRIAL'];
    const normalizedStatus = String(status || '').toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed statuses: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const tenant = await queryOne('SELECT id, name, status FROM schoolnext_erp.tenant WHERE id = ?', [id]).catch(() => null);
    if (!tenant) {
      return NextResponse.json({ error: `Institution with ID '${id}' not found.` }, { status: 404 });
    }

    // Update status in Tenant table
    await query(`
      UPDATE schoolnext_erp.tenant 
      SET status = ?, updatedAt = NOW()
      WHERE id = ?
    `, [normalizedStatus === 'ARCHIVED' ? 'CANCELLED' : normalizedStatus, id]);

    // If suspended, update users status or subscription status
    if (normalizedStatus === 'SUSPENDED') {
      await query(`
        UPDATE schoolnext_erp.user 
        SET status = 'SUSPENDED' 
        WHERE tenantId = ? AND isSuperAdmin = 0
      `, [id]).catch(() => {});
    } else if (normalizedStatus === 'ACTIVE') {
      await query(`
        UPDATE schoolnext_erp.user 
        SET status = 'ACTIVE' 
        WHERE tenantId = ? AND status = 'SUSPENDED' AND isSuperAdmin = 0
      `, [id]).catch(() => {});
    }

    // Audit log
    await query(`
      INSERT INTO schoolnext_erp.auditlog (
        id, tenantId, userId, action, entityType, entityId, oldValues, newValues, createdAt
      ) VALUES (?, ?, ?, 'STATUS_CHANGE', 'TENANT', ?, ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      id,
      session.id,
      id,
      JSON.stringify({ previousStatus: tenant.status }),
      JSON.stringify({ newStatus: normalizedStatus, reason: reason || 'Owner operational change' }),
    ]).catch(() => {});

    return NextResponse.json({
      status: 'success',
      message: `Institution '${tenant.name}' status has been set to ${normalizedStatus}.`,
      newStatus: normalizedStatus,
    });
  } catch (error) {
    console.error('Tenant status update API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
