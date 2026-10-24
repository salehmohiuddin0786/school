import { prisma } from '../../db/prisma.js';
import { hashPassword } from '../../utils/crypto.js';
import { logAudit } from '../../utils/audit.js';

export async function listParents(tenantId, { search, page = 1, limit = 20 }) {
  const where = { tenantId };

  if (search) {
    where.OR = [
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { email: { contains: search } } },
      { user: { phone: { contains: search } } },
      { occupation: { contains: search } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [parents, total] = await Promise.all([
    prisma.parentProfile.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        studentParents: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.parentProfile.count({ where }),
  ]);

  return { parents, total };
}

export async function getParentById(id, tenantId) {
  return prisma.parentProfile.findFirst({
    where: { id, tenantId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
      studentParents: {
        include: {
          student: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
              campus: { select: { name: true } },
              enrollments: {
                take: 1,
                orderBy: { enrollmentDate: 'desc' },
                include: {
                  section: { select: { name: true, course: { select: { name: true } } } },
                  academicYear: { select: { name: true, isCurrent: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function createParent(tenantId, data, userId = null, req = null) {
  const normalizedEmail = data.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    throw new Error(`A user with email '${data.email}' already exists.`);
  }

  const parentRole = await prisma.role.findFirst({
    where: { code: 'PARENT', OR: [{ tenantId }, { tenantId: null }] },
  });
  if (!parentRole) {
    throw new Error("System role 'PARENT' is not configured.");
  }

  const passwordHash = await hashPassword(data.password || 'Parent@SchoolNext2026!');

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
        roleId: parentRole.id,
        tenantId,
      },
    });

    const parentProfile = await tx.parentProfile.create({
      data: {
        tenantId,
        userId: user.id,
        occupation: data.occupation || null,
        annualIncome: data.annualIncome || null,
        alternatePhone: data.alternatePhone || null,
        address: data.address || null,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return parentProfile;
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE',
    entityType: 'PARENT',
    entityId: result.id,
    newValues: { name: `${result.user.firstName} ${result.user.lastName}`, email: data.email },
    req,
  });

  return result;
}

export async function linkStudentToParent(tenantId, parentProfileId, { studentId, relationship, isPrimaryContact, canPickup }, userId = null, req = null) {
  const parent = await prisma.parentProfile.findFirst({ where: { id: parentProfileId, tenantId } });
  if (!parent) throw new Error('Parent profile not found.');

  const student = await prisma.student.findFirst({ where: { id: studentId, tenantId } });
  if (!student) throw new Error('Student not found in your institution.');

  const existing = await prisma.studentParent.findUnique({
    where: {
      tenantId_studentId_parentProfileId: {
        tenantId,
        studentId,
        parentProfileId,
      },
    },
  });
  if (existing) throw new Error('Student is already linked to this parent.');

  const linked = await prisma.studentParent.create({
    data: {
      tenantId,
      parentProfileId,
      studentId,
      relationship,
      isPrimaryContact: isPrimaryContact || false,
      canPickup: canPickup !== undefined ? canPickup : true,
    },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      parent: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'LINK_STUDENT',
    entityType: 'STUDENT_PARENT',
    entityId: linked.id,
    newValues: { parentProfileId, studentId, relationship },
    req,
  });

  return linked;
}

export async function getLinkedChildrenForParentUser(tenantId, userId) {
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId },
  });
  if (!parentProfile) {
    throw new Error('No parent profile associated with this user account.');
  }

  const links = await prisma.studentParent.findMany({
    where: {
      tenantId,
      parentProfileId: parentProfile.id,
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          campus: { select: { id: true, name: true, code: true } },
          enrollments: {
            take: 1,
            orderBy: { enrollmentDate: 'desc' },
            include: {
              section: { select: { id: true, name: true, course: { select: { name: true } } } },
              academicYear: { select: { id: true, name: true, code: true, isCurrent: true } },
            },
          },
        },
      },
    },
  });

  return links.map((l) => ({
    relationship: l.relationship,
    isPrimaryContact: l.isPrimaryContact,
    canPickup: l.canPickup,
    student: l.student,
  }));
}
