import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET: View Institution Details
export async function GET(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Platform Owner access required.' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Institution ID is required.' }, { status: 400 });

    const tenant = await queryOne(`
      SELECT 
        t.*,
        sub.id as subscriptionId,
        sub.status as subscriptionStatus,
        sub.currentPeriodEnd,
        sub.trialEndsAt,
        sp.id as planId,
        sp.name as planName,
        sp.price as planPrice,
        sp.billingCycle,
        sp.maxStudents,
        sp.maxStaff,
        sp.maxCampuses
      FROM schoolnext_erp.tenant t
      LEFT JOIN schoolnext_erp.subscription sub ON t.id = sub.tenantId AND sub.status = 'ACTIVE'
      LEFT JOIN schoolnext_erp.subscriptionplan sp ON sub.planId = sp.id
      WHERE t.id = ? OR t.code = ?
      LIMIT 1
    `, [id, id]).catch(() => null);

    if (!tenant) {
      return NextResponse.json({ error: `Institution with ID '${id}' not found.` }, { status: 404 });
    }

    // Campuses
    const campuses = await query(`
      SELECT id, code, name, address, phone, email, isMain, isActive, createdAt
      FROM schoolnext_erp.campus
      WHERE tenantId = ?
      ORDER BY isMain DESC, name ASC
    `, [tenant.id]).catch(() => []);

    // Owner Users
    const owners = await query(`
      SELECT u.id, u.email, u.firstName, u.lastName, u.phone, u.status, u.createdAt, r.code as roleCode
      FROM schoolnext_erp.user u
      JOIN schoolnext_erp.userrole ur ON u.id = ur.userId
      JOIN schoolnext_erp.role r ON ur.roleId = r.id
      WHERE u.tenantId = ? AND r.code IN ('OWNER', 'SCHOOL_ADMIN', 'COLLEGE_ADMIN')
    `, [tenant.id]).catch(() => []);

    // Metrics counts
    const studentCount = await queryOne('SELECT COUNT(*) as cnt FROM schoolnext_erp.student WHERE tenantId = ?', [tenant.id]).catch(() => ({ cnt: 0 }));
    const teacherCount = await queryOne('SELECT COUNT(*) as cnt FROM schoolnext_erp.teacherprofile WHERE tenantId = ?', [tenant.id]).catch(() => ({ cnt: 0 }));

    const institutionData = {
      ...tenant,
      campuses,
      owners,
      studentCount: Number(studentCount?.cnt || 0),
      teacherCount: Number(teacherCount?.cnt || 0),
    };

    return NextResponse.json({
      status: 'success',
      success: true,
      data: institutionData,
      institution: institutionData,
    });
  } catch (error) {
    console.error('Get institution details API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit Institution
export async function PUT(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Platform Owner access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, type, address, city, state, postalCode, phone, email, website, logoUrl, status } = body;

    const existing = await queryOne('SELECT id, name FROM schoolnext_erp.tenant WHERE id = ?', [id]).catch(() => null);
    if (!existing) {
      return NextResponse.json({ error: `Institution with ID '${id}' not found.` }, { status: 404 });
    }

    await query(`
      UPDATE schoolnext_erp.tenant
      SET 
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        postalCode = COALESCE(?, postalCode),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        website = COALESCE(?, website),
        logoUrl = COALESCE(?, logoUrl),
        status = COALESCE(?, status),
        updatedAt = NOW()
      WHERE id = ?
    `, [name, type, address, city, state, postalCode, phone, email, website, logoUrl, status, id]);

    // Audit log
    await query(`
      INSERT INTO schoolnext_erp.auditlog (
        id, tenantId, userId, action, entityType, entityId, newValues, createdAt
      ) VALUES (?, ?, ?, 'UPDATE', 'TENANT', ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      id,
      session.id,
      id,
      JSON.stringify(body),
    ]).catch(() => {});

    return NextResponse.json({
      status: 'success',
      message: 'Institution profile updated successfully.',
    });
  } catch (error) {
    console.error('Update institution API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
