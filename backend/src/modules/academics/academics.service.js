import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

// -------------------------------------------------------------
// ACADEMIC YEARS
// -------------------------------------------------------------
export async function listAcademicYears(tenantId) {
  return prisma.academicYear.findMany({
    where: { tenantId },
    orderBy: { startDate: 'desc' },
    include: {
      _count: {
        select: {
          sections: true,
          enrollments: true,
        },
      },
    },
  });
}

export async function getCurrentAcademicYear(tenantId) {
  return prisma.academicYear.findFirst({
    where: { tenantId, isCurrent: true },
  });
}

export async function createAcademicYear(tenantId, data, userId = null, req = null) {
  const existing = await prisma.academicYear.findUnique({
    where: { tenantId_code: { tenantId, code: data.code } },
  });
  if (existing) {
    throw new Error(`Academic year with code '${data.code}' already exists.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    if (data.isCurrent) {
      await tx.academicYear.updateMany({
        where: { tenantId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return tx.academicYear.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent || false,
      },
    });
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE',
    entityType: 'ACADEMIC_YEAR',
    entityId: result.id,
    newValues: { code: result.code, name: result.name },
    req,
  });

  return result;
}

export async function setCurrentAcademicYear(id, tenantId, userId = null, req = null) {
  const existing = await prisma.academicYear.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    throw new Error('Academic year not found.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.academicYear.updateMany({
      where: { tenantId, isCurrent: true },
      data: { isCurrent: false },
    });

    return tx.academicYear.update({
      where: { id },
      data: { isCurrent: true },
    });
  });

  await logAudit({
    tenantId,
    userId,
    action: 'SET_CURRENT',
    entityType: 'ACADEMIC_YEAR',
    entityId: id,
    newValues: { isCurrent: true },
    req,
  });

  return updated;
}

export async function updateAcademicYear(id, tenantId, data, userId = null, req = null) {
  const existing = await prisma.academicYear.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Academic year not found.');

  const updated = await prisma.academicYear.update({
    where: { id },
    data,
  });

  await logAudit({
    tenantId,
    userId,
    action: 'UPDATE',
    entityType: 'ACADEMIC_YEAR',
    entityId: id,
    oldValues: existing,
    newValues: updated,
    req,
  });

  return updated;
}

// -------------------------------------------------------------
// DEPARTMENTS
// -------------------------------------------------------------
export async function listDepartments(tenantId, campusId = null) {
  const where = { tenantId };
  if (campusId) where.campusId = campusId;

  return prisma.department.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      campus: { select: { id: true, name: true, code: true } },
      _count: { select: { courses: true, subjects: true } },
    },
  });
}

export async function createDepartment(tenantId, data, userId = null, req = null) {
  const existing = await prisma.department.findUnique({
    where: { tenantId_code: { tenantId, code: data.code } },
  });
  if (existing) throw new Error(`Department code '${data.code}' already exists.`);

  const dept = await prisma.department.create({
    data: {
      tenantId,
      campusId: data.campusId || null,
      code: data.code,
      name: data.name,
      description: data.description || null,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE',
    entityType: 'DEPARTMENT',
    entityId: dept.id,
    newValues: { code: dept.code, name: dept.name },
    req,
  });

  return dept;
}

export async function updateDepartment(id, tenantId, data, userId = null, req = null) {
  const existing = await prisma.department.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Department not found.');

  return prisma.department.update({
    where: { id },
    data,
  });
}

// -------------------------------------------------------------
// COURSES / CLASSES
// -------------------------------------------------------------
export async function listCourses(tenantId, departmentId = null) {
  const where = { tenantId };
  if (departmentId) where.departmentId = departmentId;

  return prisma.course.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { sections: true, semesters: true } },
    },
  });
}

export async function createCourse(tenantId, data, userId = null, req = null) {
  const existing = await prisma.course.findUnique({
    where: { tenantId_code: { tenantId, code: data.code } },
  });
  if (existing) throw new Error(`Course/Class with code '${data.code}' already exists.`);

  const course = await prisma.course.create({
    data: {
      tenantId,
      departmentId: data.departmentId || null,
      code: data.code,
      name: data.name,
      description: data.description || null,
      durationYears: data.durationYears || 1,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE',
    entityType: 'COURSE',
    entityId: course.id,
    newValues: { code: course.code, name: course.name },
    req,
  });

  return course;
}

export async function updateCourse(id, tenantId, data, userId = null, req = null) {
  const existing = await prisma.course.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Course not found.');

  return prisma.course.update({
    where: { id },
    data,
  });
}

// -------------------------------------------------------------
// SECTIONS
// -------------------------------------------------------------
export async function listSections(tenantId, { courseId, academicYearId } = {}) {
  const where = { tenantId };
  if (courseId) where.courseId = courseId;
  if (academicYearId) where.academicYearId = academicYearId;

  return prisma.section.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      course: { select: { id: true, name: true, code: true } },
      academicYear: { select: { id: true, name: true, code: true } },
      _count: {
        select: {
          enrollments: true,
          classSubjects: true,
        },
      },
    },
  });
}

export async function getSectionById(id, tenantId) {
  return prisma.section.findFirst({
    where: { id, tenantId },
    include: {
      course: true,
      academicYear: true,
      classSubjects: {
        include: {
          subject: true,
          teacherAssignments: {
            include: {
              teacher: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      },
      enrollments: {
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { rollNumber: 'asc' },
      },
    },
  });
}

export async function createSection(tenantId, data, userId = null, req = null) {
  const section = await prisma.section.create({
    data: {
      tenantId,
      courseId: data.courseId || null,
      academicYearId: data.academicYearId,
      name: data.name,
      capacity: data.capacity || 40,
    },
    include: {
      course: true,
      academicYear: true,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE',
    entityType: 'SECTION',
    entityId: section.id,
    newValues: { name: section.name, courseId: section.courseId },
    req,
  });

  return section;
}

export async function updateSection(id, tenantId, data, userId = null, req = null) {
  const existing = await prisma.section.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Section not found.');

  return prisma.section.update({
    where: { id },
    data,
    include: { course: true, academicYear: true },
  });
}

// -------------------------------------------------------------
// SUBJECTS
// -------------------------------------------------------------
export async function listSubjects(tenantId, departmentId = null) {
  const where = { tenantId };
  if (departmentId) where.departmentId = departmentId;

  return prisma.subject.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { classSubjects: true, examSubjects: true } },
    },
  });
}

export async function createSubject(tenantId, data, userId = null, req = null) {
  const existing = await prisma.subject.findUnique({
    where: { tenantId_code: { tenantId, code: data.code } },
  });
  if (existing) throw new Error(`Subject with code '${data.code}' already exists.`);

  const subject = await prisma.subject.create({
    data: {
      tenantId,
      departmentId: data.departmentId || null,
      code: data.code,
      name: data.name,
      creditHours: data.creditHours || null,
      isElective: data.isElective || false,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE',
    entityType: 'SUBJECT',
    entityId: subject.id,
    newValues: { code: subject.code, name: subject.name },
    req,
  });

  return subject;
}

export async function updateSubject(id, tenantId, data, userId = null, req = null) {
  const existing = await prisma.subject.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Subject not found.');

  return prisma.subject.update({
    where: { id },
    data,
  });
}

// -------------------------------------------------------------
// CLASS SUBJECT LINKING
// -------------------------------------------------------------
export async function linkClassSubject(tenantId, { sectionId, subjectId }, userId = null, req = null) {
  // Validate section belongs to tenant
  const section = await prisma.section.findFirst({ where: { id: sectionId, tenantId } });
  if (!section) throw new Error('Section not found.');

  // Validate subject belongs to tenant
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, tenantId } });
  if (!subject) throw new Error('Subject not found.');

  const existing = await prisma.classSubject.findUnique({
    where: {
      tenantId_sectionId_subjectId: {
        tenantId,
        sectionId,
        subjectId,
      },
    },
  });
  if (existing) throw new Error('Subject is already mapped to this section.');

  const classSubject = await prisma.classSubject.create({
    data: {
      tenantId,
      sectionId,
      subjectId,
    },
    include: {
      section: true,
      subject: true,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'LINK_SUBJECT',
    entityType: 'CLASS_SUBJECT',
    entityId: classSubject.id,
    newValues: { sectionId, subjectId },
    req,
  });

  return classSubject;
}
