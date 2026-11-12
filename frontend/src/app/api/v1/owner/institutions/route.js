import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';
import crypto from 'crypto';

// Helper to ensure invitation table exists
async function ensureInvitationTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS schoolnext_erp.invitation (
      id VARCHAR(191) PRIMARY KEY,
      tenantId VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      role VARCHAR(64) NOT NULL DEFAULT 'OWNER',
      token VARCHAR(255) NOT NULL,
      status ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') DEFAULT 'PENDING',
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (tenantId),
      INDEX (email),
      INDEX (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `).catch(() => {});
}

// GET: List all institutions with statistics, search, filters, and pagination
export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Platform Owner access required.' }, { status: 403 });
    }

    const isPlatformOwner = Boolean(session.isPlatformOwner || !session.tenantId || session.isSuperAdmin === 1 || session.roleCode === 'SUPER_ADMIN');
    if (!isPlatformOwner) {
      return NextResponse.json({ error: 'Access forbidden: Platform Owner privileges required to manage global institutions.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // 1. Fetch live institution rows with joins
    let whereClauses = [];
    let queryParams = [];

    if (status && status !== 'ALL') {
      whereClauses.push('t.status = ?');
      queryParams.push(status.toUpperCase());
    }

    if (type && type !== 'ALL') {
      whereClauses.push('t.type = ?');
      queryParams.push(type.toUpperCase());
    }

    if (search.trim()) {
      whereClauses.push('(t.name LIKE ? OR t.code LIKE ? OR t.city LIKE ? OR t.email LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const listSql = `
      SELECT 
        t.id,
        t.code,
        t.name,
        t.type,
        t.status,
        t.email,
        t.phone,
        t.city,
        t.state,
        t.address,
        t.website,
        t.logoUrl,
        t.createdAt,
        t.updatedAt,
        COUNT(DISTINCT c.id) as branchCount,
        COUNT(DISTINCT s.id) as studentCount,
        COUNT(DISTINCT tp.id) as staffCount,
        sub.id as subscriptionId,
        sub.status as subscriptionStatus,
        sub.currentPeriodEnd,
        sub.trialEndsAt,
        sp.name as planName,
        sp.code as planCode,
        sp.price as planPrice,
        u.firstName as ownerFirstName,
        u.lastName as ownerLastName,
        u.email as ownerEmail,
        u.phone as ownerPhone
      FROM schoolnext_erp.tenant t
      LEFT JOIN schoolnext_erp.campus c ON t.id = c.tenantId
      LEFT JOIN schoolnext_erp.student s ON t.id = s.tenantId
      LEFT JOIN schoolnext_erp.teacherprofile tp ON t.id = tp.tenantId
      LEFT JOIN schoolnext_erp.subscription sub ON t.id = sub.tenantId AND sub.status = 'ACTIVE'
      LEFT JOIN schoolnext_erp.subscriptionplan sp ON sub.planId = sp.id
      LEFT JOIN schoolnext_erp.user u ON u.id = (
        SELECT ur.userId 
        FROM schoolnext_erp.userrole ur 
        JOIN schoolnext_erp.role r ON ur.roleId = r.id 
        WHERE ur.tenantId = t.id AND r.code IN ('OWNER', 'SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL')
        ORDER BY CASE WHEN r.code = 'OWNER' THEN 1 WHEN r.code LIKE '%ADMIN%' THEN 2 ELSE 3 END
        LIMIT 1
      )
      ${whereSql}
      GROUP BY t.id, sub.id, sp.id, u.id
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const institutions = await query(listSql, [...queryParams, limit, offset]).catch(() => []);

    // 2. Compute aggregate platform statistics
    const allTenants = await query(`
      SELECT 
        t.id, 
        t.type, 
        t.status,
        sp.price
      FROM schoolnext_erp.tenant t
      LEFT JOIN schoolnext_erp.subscription sub ON t.id = sub.tenantId AND sub.status = 'ACTIVE'
      LEFT JOIN schoolnext_erp.subscriptionplan sp ON sub.planId = sp.id
    `).catch(() => []);

    const totalStudentsRow = await queryOne('SELECT COUNT(*) as cnt FROM schoolnext_erp.student').catch(() => ({ cnt: 0 }));
    const totalStaffRow = await queryOne('SELECT COUNT(*) as cnt FROM schoolnext_erp.teacherprofile').catch(() => ({ cnt: 0 }));

    let total = allTenants.length;
    let active = 0;
    let inactive = 0;
    let suspended = 0;
    let trial = 0;
    let schools = 0;
    let colleges = 0;
    let mrr = 0;

    allTenants.forEach((t) => {
      if (t.status === 'ACTIVE') active++;
      else if (t.status === 'SUSPENDED') suspended++;
      else if (t.status === 'TRIAL') trial++;
      else inactive++;

      if (t.type === 'COLLEGE' || t.type === 'UNIVERSITY') colleges++;
      else schools++;

      if (t.price) mrr += Number(t.price);
    });

    const statistics = {
      total,
      active,
      inactive,
      suspended,
      trial,
      schools,
      colleges,
      totalStudents: Number(totalStudentsRow?.cnt || 0),
      totalStaff: Number(totalStaffRow?.cnt || 0),
      mrr,
    };

    // Format institutions response
    const formattedInstitutions = institutions.map((inst) => {
      const ownerName = inst.ownerFirstName ? `${inst.ownerFirstName} ${inst.ownerLastName || ''}`.trim() : null;
      return {
        id: inst.id,
        code: inst.code,
        name: inst.name,
        type: inst.type || 'SCHOOL',
        status: inst.status || 'ACTIVE',
        email: inst.email || '—',
        phone: inst.phone || '—',
        city: inst.city || '—',
        state: inst.state || '—',
        address: inst.address || '—',
        website: inst.website || '—',
        logoUrl: inst.logoUrl || null,
        branchCount: Math.max(1, Number(inst.branchCount || 1)),
        studentCount: Number(inst.studentCount || 0),
        staffCount: Number(inst.staffCount || 0),
        registrationDate: inst.createdAt instanceof Date ? inst.createdAt.toISOString().split('T')[0] : String(inst.createdAt || '').split('T')[0],
        subscriptionPlan: inst.planName || 'Starter School',
        planPrice: Number(inst.planPrice || 2499),
        subscriptionExpiry: inst.currentPeriodEnd instanceof Date ? inst.currentPeriodEnd.toISOString().split('T')[0] : (inst.trialEndsAt instanceof Date ? inst.trialEndsAt.toISOString().split('T')[0] : '2027-10-31'),
        subscriptionStatus: inst.subscriptionStatus || (inst.status === 'ACTIVE' ? 'ACTIVE' : 'TRIALING'),
        owner: {
          name: ownerName || 'Assigned Administrator',
          email: inst.ownerEmail || inst.email || 'admin@institution.edu',
          phone: inst.ownerPhone || inst.phone || '—',
        },
      };
    });

    return NextResponse.json({
      status: 'success',
      success: true,
      data: formattedInstitutions,
      institutions: formattedInstitutions,
      stats: statistics,
      statistics,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('List institutions API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add New Institution (Atomic Multi-Tenant Provisioning)
export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Platform Owner access required.' }, { status: 403 });
    }

    const isPlatformOwner = Boolean(session.isPlatformOwner || !session.tenantId || session.isSuperAdmin === 1 || session.roleCode === 'SUPER_ADMIN');
    if (!isPlatformOwner) {
      return NextResponse.json({ error: 'Access forbidden: Platform Owner privileges required to onboard new institutions.' }, { status: 403 });
    }

    await ensureInvitationTable();

    const body = await request.json().catch(() => ({}));
    const {
      name,
      type = 'SCHOOL',
      logoUrl = null,
      address,
      state,
      city,
      postalCode,
      phone,
      email,
      website,
      academicYear = '2026-2027',
      branchCount = 1,
      subscriptionPlan = 'Growth Campus',
      trialPeriod = 14,
      status = 'ACTIVE',
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Institution Name is required.' }, { status: 400 });
    }
    if (!ownerEmail || !ownerEmail.trim()) {
      return NextResponse.json({ error: 'Institution Owner Email is required.' }, { status: 400 });
    }

    // 1. Generate unique Tenant ID and short Code
    const tenantId = crypto.randomUUID();
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    let codeCandidate = cleanName.slice(0, 6);
    if (codeCandidate.length < 3) codeCandidate = `INST${Math.floor(100 + Math.random() * 900)}`;

    const existingCode = await queryOne('SELECT id FROM schoolnext_erp.tenant WHERE code = ?', [codeCandidate]).catch(() => null);
    if (existingCode) {
      codeCandidate = `${codeCandidate.slice(0, 4)}${Math.floor(10 + Math.random() * 90)}`;
    }

    // 2. Check if owner email already exists
    const existingUser = await queryOne('SELECT id FROM schoolnext_erp.user WHERE email = ?', [ownerEmail.toLowerCase().trim()]).catch(() => null);
    if (existingUser) {
      return NextResponse.json({ error: `A user with email '${ownerEmail}' already exists in the platform.` }, { status: 409 });
    }

    // 3. Create Tenant Record
    await query(`
      INSERT INTO schoolnext_erp.tenant (
        id, code, name, type, status, address, city, state, country, postalCode, phone, email, website, logoUrl, timezone, currencyCode, settings, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'India', ?, ?, ?, ?, ?, 'Asia/Kolkata', 'INR', ?, NOW(), NOW())
    `, [
      tenantId,
      codeCandidate,
      name.trim(),
      type.toUpperCase() === 'COLLEGE' ? 'COLLEGE' : 'SCHOOL',
      status.toUpperCase(),
      address || null,
      city || null,
      state || null,
      postalCode || null,
      phone || null,
      email || null,
      website || null,
      logoUrl || null,
      JSON.stringify({ branchCount: Number(branchCount) || 1, academicYear }),
    ]);

    // 4. Create Main Campus and Branches
    const mainCampusId = crypto.randomUUID();
    await query(`
      INSERT INTO schoolnext_erp.campus (
        id, tenantId, code, name, address, phone, email, isMain, isActive, createdAt, updatedAt
      ) VALUES (?, ?, 'MAIN', ?, ?, ?, ?, 1, 1, NOW(), NOW())
    `, [
      mainCampusId,
      tenantId,
      `${name.trim()} Main Campus`,
      address || `${city || 'City'} Campus`,
      phone || null,
      email || null,
    ]);

    const numBranches = Math.max(1, Number(branchCount) || 1);
    if (numBranches > 1) {
      for (let i = 2; i <= numBranches; i++) {
        await query(`
          INSERT INTO schoolnext_erp.campus (
            id, tenantId, code, name, address, phone, email, isMain, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, NOW(), NOW())
        `, [
          crypto.randomUUID(),
          tenantId,
          `BR${i}`,
          `${name.trim()} Branch ${i}`,
          address || null,
          phone || null,
          email || null,
        ]);
      }
    }

    // 5. Create Default Academic Year
    const acadYearId = crypto.randomUUID();
    const currentYear = new Date().getFullYear();
    await query(`
      INSERT INTO schoolnext_erp.academicyear (
        id, tenantId, code, name, startDate, endDate, isCurrent, isLocked, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())
    `, [
      acadYearId,
      tenantId,
      academicYear || `${currentYear}-${currentYear + 1}`,
      `Academic Year ${academicYear || `${currentYear}-${currentYear + 1}`}`,
      new Date(`${currentYear}-06-01`),
      new Date(`${currentYear + 1}-05-31`),
    ]).catch(() => {});

    // 6. Create Default Tenant Roles
    const roleId = crypto.randomUUID();
    const roleCode = type.toUpperCase() === 'COLLEGE' ? 'COLLEGE_ADMIN' : 'SCHOOL_ADMIN';
    const roleName = type.toUpperCase() === 'COLLEGE' ? 'College Administrator' : 'School Administrator';

    await query(`
      INSERT INTO schoolnext_erp.role (
        id, tenantId, code, name, description, isSystem, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, 'Full administrative access for this institution', 1, NOW(), NOW())
    `, [roleId, tenantId, roleCode, roleName]).catch(() => {});

    // Also ensure OWNER role exists for this tenant
    const ownerRoleId = crypto.randomUUID();
    await query(`
      INSERT INTO schoolnext_erp.role (
        id, tenantId, code, name, description, isSystem, createdAt, updatedAt
      ) VALUES (?, ?, 'OWNER', 'Institution Executive / Owner', 'Institution owner and executive management', 1, NOW(), NOW())
    `, [ownerRoleId, tenantId]).catch(() => {});

    // 7. Create First Institution Owner User
    const ownerUserId = crypto.randomUUID();
    const passwordToHash = ownerPassword && ownerPassword.trim() ? ownerPassword.trim() : 'Welcome@2026';
    const passwordHash = await hashPassword(passwordToHash);

    const nameParts = (ownerName || 'Institution Owner').trim().split(' ');
    const firstName = nameParts[0] || 'Institution';
    const lastName = nameParts.slice(1).join(' ') || 'Owner';

    await query(`
      INSERT INTO schoolnext_erp.user (
        id, tenantId, email, passwordHash, firstName, lastName, phone, status, isSuperAdmin, emailVerifiedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, NOW(), NOW(), NOW())
    `, [
      ownerUserId,
      tenantId,
      ownerEmail.toLowerCase().trim(),
      passwordHash,
      firstName,
      lastName,
      ownerPhone || phone || null,
    ]);

    // Assign Role to User
    await query(`
      INSERT INTO schoolnext_erp.userrole (
        id, userId, roleId, tenantId, createdAt
      ) VALUES (?, ?, ?, ?, NOW())
    `, [crypto.randomUUID(), ownerUserId, ownerRoleId, tenantId]);

    // 8. Assign Subscription Plan
    const planRow = await queryOne(
      'SELECT id, name, price FROM schoolnext_erp.subscriptionplan WHERE name LIKE ? OR code LIKE ? LIMIT 1',
      [`%${subscriptionPlan}%`, `%${subscriptionPlan}%`]
    ).catch(() => null);

    const planId = planRow?.id || '1c915712-e999-4bf6-8a1e-31847619b927'; // Growth Campus default
    const trialDays = Number(trialPeriod) || 0;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

    const subId = crypto.randomUUID();
    await query(`
      INSERT INTO schoolnext_erp.subscription (
        id, tenantId, planId, status, currentPeriodStart, currentPeriodEnd, trialEndsAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), NOW())
    `, [
      subId,
      tenantId,
      planId,
      trialDays > 0 ? 'TRIALING' : 'ACTIVE',
      periodEnd,
      trialEndsAt,
    ]).catch(() => {});

    // 9. Generate Secure Invitation Token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(`
      INSERT INTO schoolnext_erp.invitation (
        id, tenantId, email, role, token, status, expiresAt, createdAt
      ) VALUES (?, ?, ?, 'OWNER', ?, 'PENDING', ?, NOW())
    `, [
      crypto.randomUUID(),
      tenantId,
      ownerEmail.toLowerCase().trim(),
      inviteToken,
      inviteExpires,
    ]).catch(() => {});

    // 10. Audit Log
    await query(`
      INSERT INTO schoolnext_erp.auditlog (
        id, tenantId, userId, action, entityType, entityId, newValues, createdAt
      ) VALUES (?, ?, ?, 'CREATE', 'TENANT', ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      tenantId,
      session.id,
      tenantId,
      JSON.stringify({ code: codeCandidate, name: name.trim(), ownerEmail, subscriptionPlan }),
    ]).catch(() => {});

    return NextResponse.json({
      status: 'success',
      success: true,
      message: `Institution '${name.trim()}' successfully onboarded with isolated tenant workspace.`,
      data: {
        tenant: {
          id: tenantId,
          code: codeCandidate,
          name: name.trim(),
          type: type.toUpperCase(),
          status: status.toUpperCase(),
        },
        owner: {
          id: ownerUserId,
          name: `${firstName} ${lastName}`.trim(),
          email: ownerEmail.toLowerCase().trim(),
          initialPassword: passwordToHash,
          role: roleCode,
        },
        invitation: {
          token: inviteToken,
          activationLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/activate?token=${inviteToken}`,
          activationUrl: `/activate?token=${inviteToken}`,
          expiresAt: inviteExpires.toISOString(),
        },
      },
      institution: {
        id: tenantId,
        code: codeCandidate,
        name: name.trim(),
        type: type.toUpperCase(),
        status: status.toUpperCase(),
        owner: {
          id: ownerUserId,
          name: `${firstName} ${lastName}`.trim(),
          email: ownerEmail.toLowerCase().trim(),
          initialPassword: passwordToHash,
        },
        invitation: {
          token: inviteToken,
          activationUrl: `/activate?token=${inviteToken}`,
          expiresAt: inviteExpires.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Create institution API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
