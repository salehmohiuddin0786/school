import { prisma } from '../../db/prisma.js';
import { hashPassword, generateRandomToken } from '../../utils/crypto.js';
import { logAudit } from '../../utils/audit.js';

export async function admitStudent(tenantId, data, createdByUserId = null, req = null) {
  const normalizedEmail = data.email.toLowerCase().trim();

  // 1. Check duplicate admission number in this tenant
  const existingAdm = await prisma.student.findUnique({
    where: {
      tenantId_admissionNumber: {
        tenantId,
        admissionNumber: data.admissionNumber,
      },
    },
  });
  if (existingAdm) {
    throw new Error(`Admission number '${data.admissionNumber}' is already assigned to another student.`);
  }

  // 2. Check duplicate email globally or in tenant
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    throw new Error(`A user with email '${data.email}' already exists.`);
  }

  // 3. Find STUDENT role for this tenant or system
  const studentRole = await prisma.role.findFirst({
    where: {
      code: 'STUDENT',
      OR: [{ tenantId }, { tenantId: null }],
    },
  });
  if (!studentRole) {
    throw new Error("System role 'STUDENT' is not configured.");
  }

  const initialPassword = data.password || `Student@${data.admissionNumber}!`;
  const passwordHash = await hashPassword(initialPassword);

  // 4. Execute Admission in Database Transaction
  const result = await prisma.$transaction(async (tx) => {
    // A. Create User account for student
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

    // B. Assign STUDENT role
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: studentRole.id,
        tenantId,
      },
    });

    // C. Create Student Profile
    const student = await tx.student.create({
      data: {
        tenantId,
        userId: user.id,
        campusId: data.campusId || null,
        admissionNumber: data.admissionNumber,
        admissionDate: data.admissionDate || new Date(),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodGroup: data.bloodGroup || null,
        emergencyContact: data.emergencyContact || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    // D. Initial Enrollment if section provided
    let enrollment = null;
    if (data.sectionId && data.academicYearId) {
      enrollment = await tx.enrollment.create({
        data: {
          tenantId,
          studentId: student.id,
          sectionId: data.sectionId,
          academicYearId: data.academicYearId,
          rollNumber: data.rollNumber || null,
          status: 'ACTIVE',
        },
      });
    }

    // E. Optional Parent Profile & Link
    let parentResult = null;
    if (data.parent && data.parent.email) {
      const parentEmail = data.parent.email.toLowerCase().trim();
      let parentUser = await tx.user.findUnique({ where: { email: parentEmail } });

      const parentRole = await tx.role.findFirst({
        where: { code: 'PARENT', OR: [{ tenantId }, { tenantId: null }] },
      });

      if (!parentUser) {
        const parentPwdHash = await hashPassword('Parent@2026!');
        parentUser = await tx.user.create({
          data: {
            tenantId,
            email: parentEmail,
            passwordHash: parentPwdHash,
            firstName: data.parent.firstName,
            lastName: data.parent.lastName,
            phone: data.parent.phone || null,
            status: 'ACTIVE',
          },
        });

        if (parentRole) {
          await tx.userRole.create({
            data: { userId: parentUser.id, roleId: parentRole.id, tenantId },
          });
        }
      }

      let parentProfile = await tx.parentProfile.findUnique({
        where: { userId: parentUser.id },
      });
      if (!parentProfile) {
        parentProfile = await tx.parentProfile.create({
          data: {
            tenantId,
            userId: parentUser.id,
            occupation: data.parent.occupation || null,
          },
        });
      }

      await tx.studentParent.create({
        data: {
          tenantId,
          studentId: student.id,
          parentProfileId: parentProfile.id,
          relationship: data.parent.relationship || 'FATHER',
          isPrimaryContact: data.parent.isPrimaryContact ?? true,
        },
      });

      parentResult = { parentUser, parentProfile };
    }

    return { student, enrollment, parent: parentResult };
  });

  await logAudit({
    tenantId,
    userId: createdByUserId,
    action: 'ADMIT',
    entityType: 'STUDENT',
    entityId: result.student.id,
    newValues: {
      admissionNumber: result.student.admissionNumber,
      name: `${result.student.user.firstName} ${result.student.user.lastName}`,
    },
    req,
  });

  return result;
}

export async function listStudents(tenantId, { search, sectionId, courseId, campusId, gender, page = 1, limit = 20 }) {
  const where = { tenantId };

  if (campusId) where.campusId = campusId;
  if (gender) where.gender = gender;

  if (sectionId) {
    where.enrollments = { some: { sectionId } };
  } else if (courseId) {
    where.enrollments = { some: { section: { courseId } } };
  }

  if (search) {
    where.OR = [
      { admissionNumber: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { admissionNumber: 'asc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        campus: { select: { id: true, name: true, code: true } },
        enrollments: {
          take: 1,
          orderBy: { enrollmentDate: 'desc' },
          include: {
            section: {
              include: {
                course: { select: { id: true, name: true, code: true } },
              },
            },
            academicYear: { select: { id: true, name: true, code: true, isCurrent: true } },
          },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total };
}

export async function getStudentById(id, tenantId) {
  return prisma.student.findFirst({
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
      enrollments: {
        include: {
          section: {
            include: {
              course: true,
            },
          },
          academicYear: true,
        },
        orderBy: { enrollmentDate: 'desc' },
      },
      studentParents: {
        include: {
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          attendances: true,
          markEntries: true,
          invoices: true,
          submissions: true,
        },
      },
    },
  });
}

export async function updateStudentDetails(id, tenantId, data, updatedByUserId = null, req = null) {
  const existing = await prisma.student.findFirst({
    where: { id, tenantId },
    include: { user: true },
  });
  if (!existing) throw new Error('Student not found.');

  const updated = await prisma.$transaction(async (tx) => {
    // Update user details if present
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

    // Update student fields
    return tx.student.update({
      where: { id },
      data: {
        ...(data.campusId !== undefined && { campusId: data.campusId }),
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
        ...(data.gender && { gender: data.gender }),
        ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
        ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });
  });

  await logAudit({
    tenantId,
    userId: updatedByUserId,
    action: 'UPDATE',
    entityType: 'STUDENT',
    entityId: id,
    oldValues: existing,
    newValues: updated,
    req,
  });

  return updated;
}

export async function enrollStudentInSection(tenantId, studentId, { sectionId, academicYearId, rollNumber }, userId = null, req = null) {
  const student = await prisma.student.findFirst({ where: { id: studentId, tenantId } });
  if (!student) throw new Error('Student not found.');

  const section = await prisma.section.findFirst({ where: { id: sectionId, tenantId } });
  if (!section) throw new Error('Section not found.');

  const academicYear = await prisma.academicYear.findFirst({ where: { id: academicYearId, tenantId } });
  if (!academicYear) throw new Error('Academic year not found.');

  // Upsert enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: {
      tenantId_studentId_academicYearId: {
        tenantId,
        studentId,
        academicYearId,
      },
    },
    update: {
      sectionId,
      rollNumber: rollNumber || undefined,
      status: 'ACTIVE',
    },
    create: {
      tenantId,
      studentId,
      sectionId,
      academicYearId,
      rollNumber: rollNumber || null,
      status: 'ACTIVE',
    },
    include: {
      section: true,
      academicYear: true,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'ENROLL',
    entityType: 'STUDENT',
    entityId: studentId,
    newValues: { sectionId, academicYearId, rollNumber },
    req,
  });

  return enrollment;
}
