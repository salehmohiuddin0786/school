import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

// PUT: Update Campus
export async function PUT(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, code, address, phone, email, isMain, isActive } = body;

    const campus = await queryOne('SELECT * FROM schoolnext_erp.campus WHERE id = ?', [id]).catch(() => null);
    if (!campus) {
      return NextResponse.json({ error: `Campus with ID '${id}' not found.` }, { status: 404 });
    }

    const isPlatformOwner = Boolean(session.isPlatformOwner || !session.tenantId || session.isSuperAdmin === 1 || session.roleCode === 'SUPER_ADMIN');

    // Strict Tenant Isolation: Institution Owner can ONLY update their own campuses
    if (!isPlatformOwner && campus.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Access forbidden: You cannot modify another institution’s campus.' }, { status: 403 });
    }

    if (isMain) {
      await query('UPDATE schoolnext_erp.campus SET isMain = 0 WHERE tenantId = ? AND id != ?', [campus.tenantId, id]).catch(() => {});
    }

    await query(`
      UPDATE schoolnext_erp.campus
      SET 
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        isMain = COALESCE(?, isMain),
        isActive = COALESCE(?, isActive),
        updatedAt = NOW()
      WHERE id = ?
    `, [
      name?.trim() || null,
      code?.trim() || null,
      address?.trim() || null,
      phone?.trim() || null,
      email?.trim() || null,
      typeof isMain === 'boolean' || typeof isMain === 'number' ? (isMain ? 1 : 0) : null,
      typeof isActive === 'boolean' || typeof isActive === 'number' ? (isActive ? 1 : 0) : null,
      id
    ]);

    // Audit log
    await query(`
      INSERT INTO schoolnext_erp.auditlog (
        id, tenantId, userId, action, entityType, entityId, newValues, createdAt
      ) VALUES (?, ?, ?, 'UPDATE', 'CAMPUS', ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      campus.tenantId,
      session.id,
      id,
      JSON.stringify(body),
    ]).catch(() => {});

    return NextResponse.json({
      status: 'success',
      success: true,
      message: 'Campus details updated successfully.'
    });
  } catch (error) {
    console.error('Update campus error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete or Deactivate Campus
export async function DELETE(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const { id } = await params;
    const campus = await queryOne('SELECT * FROM schoolnext_erp.campus WHERE id = ?', [id]).catch(() => null);
    if (!campus) {
      return NextResponse.json({ error: `Campus with ID '${id}' not found.` }, { status: 404 });
    }

    const isPlatformOwner = Boolean(session.isPlatformOwner || !session.tenantId || session.isSuperAdmin === 1 || session.roleCode === 'SUPER_ADMIN');

    // Strict Tenant Isolation
    if (!isPlatformOwner && campus.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Access forbidden: You cannot delete another institution’s campus.' }, { status: 403 });
    }

    if (campus.isMain) {
      return NextResponse.json({ error: 'Cannot delete the main primary campus of an institution.' }, { status: 400 });
    }

    await query('UPDATE schoolnext_erp.campus SET isActive = 0 WHERE id = ?', [id]);

    return NextResponse.json({
      status: 'success',
      success: true,
      message: `Campus '${campus.name}' has been deactivated.`
    });
  } catch (error) {
    console.error('Delete campus error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
