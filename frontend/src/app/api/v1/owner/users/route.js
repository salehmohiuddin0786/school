import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const tenantId = session.tenantId;

    if (!tenantId) {
      // Platform owner querying users
      const users = await query(`
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          CONCAT(u.firstName, ' ', u.lastName) as name,
          u.email,
          u.phone,
          u.status,
          u.createdAt,
          r.code as roleCode,
          r.name as roleName,
          t.name as institutionName
        FROM schoolnext_erp.user u
        LEFT JOIN schoolnext_erp.userrole ur ON u.id = ur.userId
        LEFT JOIN schoolnext_erp.role r ON ur.roleId = r.id
        LEFT JOIN schoolnext_erp.tenant t ON u.tenantId = t.id
        ORDER BY u.createdAt DESC
        LIMIT 50
      `).catch(() => []);

      return NextResponse.json({ status: 'success', data: users, campuses: [] });
    }

    // Tenant Isolated query
    const [users, campuses] = await Promise.all([
      query(`
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          CONCAT(u.firstName, ' ', u.lastName) as name,
          u.email,
          u.phone,
          u.status,
          u.createdAt,
          r.code as roleCode,
          r.name as roleName,
          c.id as campusId,
          c.name as campusName
        FROM schoolnext_erp.user u
        LEFT JOIN schoolnext_erp.userrole ur ON u.id = ur.userId
        LEFT JOIN schoolnext_erp.role r ON ur.roleId = r.id
        LEFT JOIN schoolnext_erp.staffprofile sp ON u.id = sp.userId
        LEFT JOIN schoolnext_erp.campus c ON sp.campusId = c.id
        WHERE u.tenantId = ?
        ORDER BY u.createdAt DESC
      `, [tenantId]).catch(() => []),
      query(`
        SELECT id, name, code, isMain 
        FROM schoolnext_erp.campus 
        WHERE tenantId = ? AND isActive = 1 
        ORDER BY isMain DESC, name ASC
      `, [tenantId]).catch(() => []),
    ]);

    return NextResponse.json({
      status: 'success',
      data: users,
      campuses,
    });
  } catch (error) {
    console.error('Owner users GET API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const tenantId = session.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required to create institutional users.' }, { status: 400 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, roleCode = 'CAMPUS_ADMIN', campusId, password } = body;

    if (!firstName || !email || !password) {
      return NextResponse.json({ error: 'First name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });
    }

    // Check if email is already taken
    const existing = await queryOne(
      'SELECT id FROM schoolnext_erp.user WHERE email = ?',
      [cleanEmail]
    ).catch(() => null);

    if (existing) {
      return NextResponse.json({ error: `A user with email "${cleanEmail}" already exists in the system.` }, { status: 409 });
    }

    // Verify or create role for this tenant
    const upperRole = roleCode.toUpperCase();
    let roleRow = await queryOne(
      'SELECT id FROM schoolnext_erp.role WHERE tenantId = ? AND code = ?',
      [tenantId, upperRole]
    ).catch(() => null);

    if (!roleRow) {
      // Look for a system role or create a tenant role
      const ROLE_NAMES = {
        CAMPUS_ADMIN: 'Campus Administrator',
        PRINCIPAL: 'Campus Principal',
        TEACHER: 'Faculty / Teacher',
        ACCOUNTANT: 'Finance & Accounts Officer',
        STAFF: 'Administrative Staff',
        OWNER: 'Institution Executive / Owner',
      };
      const roleId = crypto.randomUUID();
      const roleName = ROLE_NAMES[upperRole] || `${upperRole} Role`;

      await query(`
        INSERT INTO schoolnext_erp.role (id, tenantId, code, name, description, isSystem, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 'Role managed by institution', 1, NOW(), NOW())
      `, [roleId, tenantId, upperRole, roleName]).catch(() => {});

      roleRow = { id: roleId };
    }

    const newUserId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    // Insert user into schoolnext_erp.user
    await query(`
      INSERT INTO schoolnext_erp.user (
        id, tenantId, email, passwordHash, firstName, lastName, phone, status, isSuperAdmin, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, NOW(), NOW())
    `, [
      newUserId,
      tenantId,
      cleanEmail,
      hashedPassword,
      firstName.trim(),
      (lastName || '').trim(),
      phone ? phone.trim() : null,
    ]);

    // Assign role in userrole
    await query(`
      INSERT INTO schoolnext_erp.userrole (id, userId, roleId, tenantId, createdAt)
      VALUES (?, ?, ?, ?, NOW())
    `, [crypto.randomUUID(), newUserId, roleRow.id, tenantId]);

    // If campusId provided, link campus via staffprofile
    let validCampusId = campusId;
    if (!validCampusId) {
      // Find main campus of tenant
      const mainCampus = await queryOne(
        'SELECT id FROM schoolnext_erp.campus WHERE tenantId = ? ORDER BY isMain DESC LIMIT 1',
        [tenantId]
      ).catch(() => null);
      validCampusId = mainCampus?.id || null;
    }

    if (validCampusId) {
      const staffProfileId = crypto.randomUUID();
      const empCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      await query(`
        INSERT INTO schoolnext_erp.staffprofile (
          id, tenantId, campusId, userId, employeeCode, department, designation, joiningDate, employmentType, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, 'Administration', ?, NOW(), 'FULL_TIME', NOW(), NOW())
      `, [
        staffProfileId,
        tenantId,
        validCampusId,
        newUserId,
        empCode,
        upperRole,
      ]).catch(() => {});
    }

    // Also mirror to legacy users table so user can log in seamlessly across legacy harnesses
    try {
      const legacyRoleMap = {
        CAMPUS_ADMIN: 'admin',
        PRINCIPAL: 'admin',
        ACCOUNTANT: 'admin',
        TEACHER: 'teacher',
        STAFF: 'admin',
        OWNER: 'owner',
      };
      await query(`
        INSERT IGNORE INTO users (email, password_hash, role, theme)
        VALUES (?, ?, ?, 'light')
      `, [cleanEmail, hashedPassword, legacyRoleMap[upperRole] || 'admin']).catch(() => {});
    } catch {}

    // Audit log
    await query(`
      INSERT INTO schoolnext_erp.auditlog (
        id, tenantId, userId, action, entityType, entityId, newValues, createdAt
      ) VALUES (?, ?, ?, 'CREATE_USER', 'USER', ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      tenantId,
      session.id || 'system',
      newUserId,
      JSON.stringify({ email: cleanEmail, role: upperRole, campusId: validCampusId }),
    ]).catch(() => {});

    return NextResponse.json({
      status: 'success',
      message: `User ${cleanEmail} created successfully.`,
      user: {
        id: newUserId,
        name: `${firstName} ${lastName || ''}`.trim(),
        email: cleanEmail,
        roleCode: upperRole,
        campusId: validCampusId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Owner users POST API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
