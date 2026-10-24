import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

export async function listCampuses({ tenantId, search, isActive }) {
  const where = { tenantId };
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { address: { contains: search } },
    ];
  }

  const campuses = await prisma.campus.findMany({
    where,
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          departments: true,
          students: true,
          teachers: true,
          classRooms: true,
        },
      },
    },
  });

  return campuses;
}

export async function getCampusById(id, tenantId) {
  return prisma.campus.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: {
          departments: true,
          students: true,
          teachers: true,
          classRooms: true,
        },
      },
      departments: true,
      classRooms: true,
    },
  });
}

export async function createCampus(tenantId, data, userId = null, req = null) {
  const existingCode = await prisma.campus.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: data.code,
      },
    },
  });

  if (existingCode) {
    throw new Error(`A campus with code '${data.code}' already exists in your institution.`);
  }

  // If this campus is set as isMain, unset isMain on other campuses in transaction
  const campus = await prisma.$transaction(async (tx) => {
    if (data.isMain) {
      await tx.campus.updateMany({
        where: { tenantId, isMain: true },
        data: { isMain: false },
      });
    }

    return tx.campus.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email || null,
        isMain: data.isMain || false,
        isActive: true,
      },
    });
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE',
    entityType: 'CAMPUS',
    entityId: campus.id,
    newValues: { code: campus.code, name: campus.name },
    req,
  });

  return campus;
}

export async function updateCampus(id, tenantId, data, userId = null, req = null) {
  const existing = await prisma.campus.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw new Error('Campus not found.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isMain) {
      await tx.campus.updateMany({
        where: { tenantId, isMain: true, NOT: { id } },
        data: { isMain: false },
      });
    }

    return tx.campus.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.isMain !== undefined && { isMain: data.isMain }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  });

  await logAudit({
    tenantId,
    userId,
    action: 'UPDATE',
    entityType: 'CAMPUS',
    entityId: id,
    oldValues: existing,
    newValues: updated,
    req,
  });

  return updated;
}
