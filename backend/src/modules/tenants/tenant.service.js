import { prisma } from '../../db/prisma.js';
import { hashPassword } from '../../utils/crypto.js';
import { logAudit } from '../../utils/audit.js';

export async function listTenants({ search, status, page = 1, limit = 20 }) {
  const where = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            campuses: true,
          },
        },
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { plan: true },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return { tenants, total };
}

export async function getTenantById(id) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          students: true,
          campuses: true,
          departments: true,
          courses: true,
        },
      },
      campuses: {
        where: { isMain: true },
        take: 1,
      },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { plan: true },
      },
      academicYears: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  });

  return tenant;
}

export async function createTenantWithAdmin(data, superAdminId = null, req = null) {
  const existingCode = await prisma.tenant.findUnique({
    where: { code: data.code },
  });
  if (existingCode) {
    throw new Error(`Institution code '${data.code}' is already registered.`);
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: data.adminEmail.toLowerCase().trim() },
  });
  if (existingEmail) {
    throw new Error(`A user with email '${data.adminEmail}' already exists.`);
  }

  const adminPasswordHash = await hashPassword(data.adminPassword);

  // Execute multi-record creation atomically in a database transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Tenant
    const tenant = await tx.tenant.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country || 'India',
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        website: data.website,
        timezone: data.timezone || 'Asia/Kolkata',
        currencyCode: data.currencyCode || 'INR',
        status: 'ACTIVE',
      },
    });

    // 2. Create Main Campus
    const campus = await tx.campus.create({
      data: {
        tenantId: tenant.id,
        code: 'MAIN',
        name: `${data.name} Main Campus`,
        address: data.address,
        phone: data.phone,
        email: data.email,
        isMain: true,
        isActive: true,
      },
    });

    // 3. Create Default Academic Year (e.g. current year - next year)
    const currentYear = new Date().getFullYear();
    await tx.academicYear.create({
      data: {
        tenantId: tenant.id,
        code: `${currentYear}-${currentYear + 1}`,
        name: `Academic Year ${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
        startDate: new Date(`${currentYear}-06-01`),
        endDate: new Date(`${currentYear + 1}-05-31`),
        isCurrent: true,
      },
    });

    // 4. Create or Find SCHOOL_ADMIN role for this tenant
    const adminRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        code: 'SCHOOL_ADMIN',
        name: 'School Administrator',
        description: 'Full administrative access for the institution',
        isSystem: true,
      },
    });

    // 5. Create Tenant Admin User
    const adminUser = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: data.adminEmail.toLowerCase().trim(),
        passwordHash: adminPasswordHash,
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        phone: data.phone,
        status: 'ACTIVE',
        isSuperAdmin: false,
      },
    });

    // 6. Assign SCHOOL_ADMIN role to admin user
    await tx.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
        tenantId: tenant.id,
      },
    });

    return { tenant, campus, adminUser };
  });

  await logAudit({
    tenantId: result.tenant.id,
    userId: superAdminId,
    action: 'CREATE',
    entityType: 'TENANT',
    entityId: result.tenant.id,
    newValues: { code: data.code, name: data.name },
    req,
  });

  return result;
}

export async function updateTenantDetails(id, data, userId = null, req = null) {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Tenant not found');
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data,
  });

  await logAudit({
    tenantId: id,
    userId,
    action: 'UPDATE',
    entityType: 'TENANT',
    entityId: id,
    oldValues: existing,
    newValues: updated,
    req,
  });

  return updated;
}

export async function updateTenantStatus(id, { status, reason }, superAdminId, req = null) {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Tenant not found');
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data: { status },
  });

  await logAudit({
    tenantId: id,
    userId: superAdminId,
    action: 'UPDATE_STATUS',
    entityType: 'TENANT',
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status, reason },
    req,
  });

  return updated;
}
