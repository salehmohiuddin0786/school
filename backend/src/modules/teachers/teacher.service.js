import { prisma } from '../../db/prisma.js';
import { hashPassword } from '../../utils/crypto.js';
import { logAudit } from '../../utils/audit.js';

export async function listTeachers(tenantId, { search, campusId, page = 1, limit = 20 }) {
  const where = { tenantId };
  if (campusId) where.campusId = campusId;

  if (search) {
    where.OR = [
      { employeeCode: { contains: search } },
      { specialization: { contains: search } },
      { designation: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [teachers, total] = await Promise.all([
    prisma.teacherProfile.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { employeeCode: 'asc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, status: true } },
        campus: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            teacherAssignments: true,
            timetableEntries: true,
            assignments: true,
          },
        },
      },
    }),
    prisma.teacherProfile.count({ where }),
  ]);

  return { teachers, total };
}

export async function getTeacherById(id, tenantId) {
  return prisma.teacherProfile.findFirst({
    where: { id, tenantId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          status: true,
          lastLoginAt: true,
        },
      },
      campus: true,
      teacherAssignments: {
        include: {
          academicYear: { select: { name: true, isCurrent: true } },
          classSubject: {
            include: {
              section: { select: { id: true, name: true, course: { select: { name: true } } } },
              subject: { select: { id: true, code: true, name: true } },
            },
          },
        },
      },
      timetableEntries: {
        include: {
          section: { select: { name: true, course: { select: { name: true } } } },
          subject: { select: { name: true } },
          classRoom: { select: { roomNumber: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  });
}

export async function createTeacher(tenantId, data, userId = null, req = null) {
  const normalizedEmail = data.email.toLowerCase().trim();

  // Check unique employee code in tenant
  const existingCode = await prisma.teacherProfile.findUnique({
    where: {
      tenantId_employeeCode: {
        tenantId,
        employeeCode: data.employeeCode,
      },
    },
  });
  if (existingCode) {
    throw new Error(`Teacher employee code '${data.employeeCode}' already exists in your institution.`);
  }

  // Check unique email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    throw new Error(`A user with email '${data.email}' already exists.`);
  }

  const teacherRole = await prisma.role.findFirst({
    where: { code: 'TEACHER', OR: [{ tenantId }, { tenantId: null }] },
  });
  if (!teacherRole) {
    throw new Error("System role 'TEACHER' is not configured.");
  }

  const passwordHash = await hashPassword(data.password || `Teacher@${data.employeeCode}!`);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        tenantId,
        email: normalizedEmail,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        status: 'ACTIVE',
      },
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: teacherRole.id,
        tenantId,
      },
    });

    const teacher = await tx.teacherProfile.create({
      data: {
        tenantId,
        userId: user.id,
        campusId: data.campusId || null,
        employeeCode: data.employeeCode,
        designation: data.designation || 'Teacher',
        qualification: data.qualification || null,
        specialization: data.specialization || null,
        joiningDate: data.joiningDate || new Date(),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return teacher;
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE',
    entityType: 'TEACHER',
    entityId: result.id,
    newValues: { employeeCode: result.employeeCode, name: `${result.user.firstName} ${result.user.lastName}` },
    req,
  });

  return result;
}

export async function updateTeacherDetails(id, tenantId, data, updatedByUserId = null, req = null) {
  const existing = await prisma.teacherProfile.findFirst({
    where: { id, tenantId },
    include: { user: true },
  });
  if (!existing) throw new Error('Teacher not found.');

  const updated = await prisma.$transaction(async (tx) => {
    if (data.firstName || data.lastName || data.phone !== undefined) {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
        },
      });
    }

    return tx.teacherProfile.update({
      where: { id },
      data: {
        ...(data.campusId !== undefined && { campusId: data.campusId }),
        ...(data.designation && { designation: data.designation }),
        ...(data.qualification !== undefined && { qualification: data.qualification }),
        ...(data.specialization !== undefined && { specialization: data.specialization }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });
  });

  await logAudit({
    tenantId,
    userId,
    action: 'UPDATE',
    entityType: 'TEACHER',
    entityId: id,
    oldValues: existing,
    newValues: updated,
    req,
  });

  return updated;
}
