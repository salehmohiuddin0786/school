import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

// GET: List Campuses for Institution Owner (or Platform Owner)
export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get('tenantId');

    const isPlatformOwner = Boolean(session.isPlatformOwner || !session.tenantId || session.isSuperAdmin === 1 || session.roleCode === 'SUPER_ADMIN');

    // Tenant Isolation: Institution Owner can ONLY see their own campuses
    const tenantId = isPlatformOwner ? (tenantParam || session.tenantId) : session.tenantId;

    let campuses = [];
    if (tenantId) {
      campuses = await query(`
        SELECT 
          c.id, 
          c.tenantId, 
          c.code, 
          c.name, 
          c.address, 
          c.phone, 
          c.email, 
          c.isMain, 
          c.isActive, 
          c.createdAt,
          c.updatedAt,
          t.name as institutionName,
          t.code as institutionCode,
          (SELECT COUNT(*) FROM schoolnext_erp.student s WHERE s.campusId = c.id) as studentCount,
          (SELECT COUNT(*) FROM schoolnext_erp.teacherprofile tp WHERE tp.campusId = c.id) as staffCount
        FROM schoolnext_erp.campus c
        JOIN schoolnext_erp.tenant t ON c.tenantId = t.id
        WHERE c.tenantId = ?
        ORDER BY c.isMain DESC, c.name ASC
      `, [tenantId]).catch(() => []);
    } else if (isPlatformOwner) {
      campuses = await query(`
        SELECT 
          c.id, 
          c.tenantId, 
          c.code, 
          c.name, 
          c.address, 
          c.phone, 
          c.email, 
          c.isMain, 
          c.isActive, 
          c.createdAt,
          c.updatedAt,
          t.name as institutionName,
          t.code as institutionCode,
          (SELECT COUNT(*) FROM schoolnext_erp.student s WHERE s.campusId = c.id) as studentCount,
          (SELECT COUNT(*) FROM schoolnext_erp.teacherprofile tp WHERE tp.campusId = c.id) as staffCount
        FROM schoolnext_erp.campus c
        JOIN schoolnext_erp.tenant t ON c.tenantId = t.id
        ORDER BY t.name ASC, c.isMain DESC, c.name ASC
      `).catch(() => []);
    }

    return NextResponse.json({
      status: 'success',
      success: true,
      data: campuses,
      campuses,
    });
  } catch (error) {
    console.error('List campuses error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create New Campus for Institution Owner
export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, code, address, phone, email, isMain = 0 } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Campus name is required.' }, { status: 400 });
    }

    const isPlatformOwner = Boolean(session.isPlatformOwner || !session.tenantId || session.isSuperAdmin === 1 || session.roleCode === 'SUPER_ADMIN');
    const tenantId = isPlatformOwner ? (body.tenantId || session.tenantId) : session.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Target tenantId is required to associate campus.' }, { status: 400 });
    }

    const campusCode = (code?.trim() || name.trim().slice(0, 4).toUpperCase()).replace(/[^A-Z0-9]/gi, '');
    const campusId = crypto.randomUUID();

    // If marked as isMain, un-mark existing main campuses for this tenant
    if (isMain) {
      await query('UPDATE schoolnext_erp.campus SET isMain = 0 WHERE tenantId = ?', [tenantId]).catch(() => {});
    }

    await query(`
      INSERT INTO schoolnext_erp.campus (
        id, tenantId, code, name, address, phone, email, isMain, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [
      campusId,
      tenantId,
      campusCode,
      name.trim(),
      address?.trim() || null,
      phone?.trim() || null,
      email?.trim() || null,
      isMain ? 1 : 0
    ]);

    // Audit log
    await query(`
      INSERT INTO schoolnext_erp.auditlog (
        id, tenantId, userId, action, entityType, entityId, newValues, createdAt
      ) VALUES (?, ?, ?, 'CREATE', 'CAMPUS', ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      tenantId,
      session.id,
      campusId,
      JSON.stringify({ name: name.trim(), code: campusCode, isMain }),
    ]).catch(() => {});

    return NextResponse.json({
      status: 'success',
      success: true,
      message: `Campus '${name.trim()}' created successfully.`,
      campus: {
        id: campusId,
        tenantId,
        code: campusCode,
        name: name.trim(),
        isMain: isMain ? 1 : 0,
        isActive: 1
      }
    });
  } catch (error) {
    console.error('Create campus error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
