import { prisma } from '../../db/prisma.js';
import { hashPassword } from '../../utils/crypto.js';
import { logAudit } from '../../utils/audit.js';

export async function listUsers({ tenantId, search, role, status, page = 1, limit = 20 }) {
  const where = {};
  if (tenantId) {
    where.tenantId = tenantId;
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (role) {
    where.userRoles = {
      some: {
        role: {
          code: role,
        },
      },
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        status: true,
        isSuperAdmin: true,
        tenantId: true,
        createdAt: true,
        lastLoginAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const formatted = users.map((u) => ({
    ...u,
    roles: u.userRoles.map((ur) => ur.role),
  }));

  return { users: formatted, total };
}

export async function getUserById(id, tenantId = null) {
  const where = { id };
  if (tenantId) {
    where.tenantId = tenantId;
  }

  const user = await prisma.user.findFirst({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      status: true,
      isSuperAdmin: true,
      tenantId: true,
      createdAt: true,
      lastLoginAt: true,
      userRoles: {
        include: {
          role: true,
        },
      },
      studentProfile: true,
      teacherProfile: true,
      parentProfile: true,
      staffProfile: true,
    },
  });

  if (!user) return null;

  return {
    ...user,
    roles: user.userRoles.map((ur) => ur.role),
  };
}

export async function createUserWithRoles(data, tenantId, createdByUserId = null, req = null) {
  const normalizedEmail = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new Error(`A user with email '${data.email}' already exists.`);
  }

  const passwordHash = await hashPassword(data.password);

  // Find roles in this tenant or system roles
  const roles = await prisma.role.findMany({
    where: {
      code: { in: data.roles },
      OR: [{ tenantId }, { tenantId: null }],
    },
  });

  if (roles.length === 0) {
    throw new Error('None of the specified roles exist.');
  }

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        tenantId,
        email: normalizedEmail,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        status: 'ACTIVE',
      },
    });

    for (const r of roles) {
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: r.id,
          tenantId,
        },
      });
    }

    return user;
  });

  await logAudit({
    tenantId,
    userId: createdByUserId,
    action: 'CREATE',
    entityType: 'USER',
    entityId: newUser.id,
    newValues: { email: newUser.email, roles: data.roles },
    req,
  });

  return getUserById(newUser.id, tenantId);
}

export async function updateUserDetails(id, tenantId, data, updatedByUserId = null, req = null) {
  const existing = await prisma.user.findFirst({
    where: { id, ...(tenantId && { tenantId }) },
  });

  if (!existing) {
    throw new Error('User not found.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    if (data.roles && Array.isArray(data.roles)) {
      // Find valid roles
      const roles = await tx.role.findMany({
        where: {
          code: { in: data.roles },
          OR: [{ tenantId }, { tenantId: null }],
        },
      });

      // Remove existing role mappings
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      // Assign new roles
      for (const r of roles) {
        await tx.userRole.create({
          data: {
            userId: id,
            roleId: r.id,
            tenantId,
          },
        });
      }
    }
  });

  await logAudit({
    tenantId,
    userId: updatedByUserId,
    action: 'UPDATE',
    entityType: 'USER',
    entityId: id,
    newValues: data,
    req,
  });

  return getUserById(id, tenantId);
}

export async function updateUserStatus(id, tenantId, status, updatedByUserId = null, req = null) {
  const existing = await prisma.user.findFirst({
    where: { id, ...(tenantId && { tenantId }) },
  });

  if (!existing) {
    throw new Error('User not found.');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
  });

  // If suspended or inactive, revoke all sessions
  if (status !== 'ACTIVE') {
    await prisma.refreshSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await logAudit({
    tenantId,
    userId: updatedByUserId,
    action: 'UPDATE_STATUS',
    entityType: 'USER',
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status },
    req,
  });

  return updated;
}
