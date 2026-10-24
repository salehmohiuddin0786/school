import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

/**
 * Checks for scheduling overlaps: S1 < E2 && E1 > S2
 */
function isTimeOverlapping(s1, e1, s2, e2) {
  return s1 < e2 && e1 > s2;
}

export async function checkTimetableConflicts(tenantId, { dayOfWeek, startTime, endTime, teacherProfileId, sectionId, classRoomId, excludeId = null }) {
  // Query all entries on that day in this tenant
  const entriesOnDay = await prisma.timetableEntry.findMany({
    where: {
      tenantId,
      dayOfWeek,
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    include: {
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      section: { select: { name: true } },
      subject: { select: { name: true } },
      classRoom: { select: { roomNumber: true } },
    },
  });

  for (const entry of entriesOnDay) {
    if (isTimeOverlapping(startTime, endTime, entry.startTime, entry.endTime)) {
      // 1. Teacher Conflict
      if (entry.teacherProfileId === teacherProfileId) {
        const teacherName = `${entry.teacher.user.firstName} ${entry.teacher.user.lastName}`;
        return {
          conflict: true,
          type: 'TEACHER_CONFLICT',
          message: `Teacher ${teacherName} is already scheduled for ${entry.subject.name} in ${entry.section.name} from ${entry.startTime} to ${entry.endTime}.`,
        };
      }

      // 2. Section Conflict
      if (entry.sectionId === sectionId) {
        return {
          conflict: true,
          type: 'SECTION_CONFLICT',
          message: `Section ${entry.section.name} is already scheduled for ${entry.subject.name} from ${entry.startTime} to ${entry.endTime}.`,
        };
      }

      // 3. Classroom Conflict
      if (classRoomId && entry.classRoomId === classRoomId) {
        return {
          conflict: true,
          type: 'CLASSROOM_CONFLICT',
          message: `Room ${entry.classRoom.roomNumber} is already occupied by ${entry.section.name} (${entry.subject.name}) from ${entry.startTime} to ${entry.endTime}.`,
        };
      }
    }
  }

  return { conflict: false };
}

export async function createTimetableEntry(tenantId, data, userId = null, req = null) {
  // 1. Validate entities belong to tenant
  const section = await prisma.section.findFirst({ where: { id: data.sectionId, tenantId } });
  if (!section) throw new Error('Section not found.');

  const subject = await prisma.subject.findFirst({ where: { id: data.subjectId, tenantId } });
  if (!subject) throw new Error('Subject not found.');

  const teacher = await prisma.teacherProfile.findFirst({ where: { id: data.teacherProfileId, tenantId } });
  if (!teacher) throw new Error('Teacher profile not found.');

  if (data.classRoomId) {
    const room = await prisma.classRoom.findFirst({ where: { id: data.classRoomId, tenantId } });
    if (!room) throw new Error('Classroom not found.');
  }

  // 2. Conflict detection
  const conflictCheck = await checkTimetableConflicts(tenantId, {
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    teacherProfileId: data.teacherProfileId,
    sectionId: data.sectionId,
    classRoomId: data.classRoomId,
  });

  if (conflictCheck.conflict) {
    const err = new Error(conflictCheck.message);
    err.statusCode = 409; // Conflict
    throw err;
  }

  const entry = await prisma.timetableEntry.create({
    data: {
      tenantId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
      teacherProfileId: data.teacherProfileId,
      classRoomId: data.classRoomId || null,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    },
    include: {
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, code: true, name: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      classRoom: { select: { id: true, roomNumber: true } },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE_TIMETABLE_ENTRY',
    entityType: 'TIMETABLE_ENTRY',
    entityId: entry.id,
    newValues: {
      section: entry.section.name,
      subject: entry.subject.name,
      day: entry.dayOfWeek,
      time: `${entry.startTime}-${entry.endTime}`,
    },
    req,
  });

  return entry;
}

export async function getSectionTimetable(sectionId, tenantId) {
  const section = await prisma.section.findFirst({ where: { id: sectionId, tenantId } });
  if (!section) throw new Error('Section not found.');

  return prisma.timetableEntry.findMany({
    where: { sectionId, tenantId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: {
      subject: { select: { id: true, code: true, name: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      classRoom: { select: { id: true, roomNumber: true } },
    },
  });
}

export async function getTeacherTimetable(teacherProfileId, tenantId) {
  const teacher = await prisma.teacherProfile.findFirst({ where: { id: teacherProfileId, tenantId } });
  if (!teacher) throw new Error('Teacher not found.');

  return prisma.timetableEntry.findMany({
    where: { teacherProfileId, tenantId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: {
      section: {
        select: {
          id: true,
          name: true,
          course: { select: { name: true } },
        },
      },
      subject: { select: { id: true, code: true, name: true } },
      classRoom: { select: { id: true, roomNumber: true } },
    },
  });
}

export async function deleteTimetableEntry(id, tenantId, userId = null, req = null) {
  const existing = await prisma.timetableEntry.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Timetable entry not found.');

  await prisma.timetableEntry.delete({ where: { id } });

  await logAudit({
    tenantId,
    userId,
    action: 'DELETE_TIMETABLE_ENTRY',
    entityType: 'TIMETABLE_ENTRY',
    entityId: id,
    oldValues: existing,
    req,
  });

  return true;
}

export async function assignTeacherToSubject(tenantId, { teacherProfileId, classSubjectId, academicYearId }, userId = null, req = null) {
  const teacher = await prisma.teacherProfile.findFirst({ where: { id: teacherProfileId, tenantId } });
  if (!teacher) throw new Error('Teacher profile not found.');

  const classSubject = await prisma.classSubject.findFirst({ where: { id: classSubjectId, tenantId } });
  if (!classSubject) throw new Error('Class subject not found.');

  const academicYear = await prisma.academicYear.findFirst({ where: { id: academicYearId, tenantId } });
  if (!academicYear) throw new Error('Academic year not found.');

  const existing = await prisma.teacherAssignment.findUnique({
    where: {
      tenantId_teacherProfileId_classSubjectId_academicYearId: {
        tenantId,
        teacherProfileId,
        classSubjectId,
        academicYearId,
      },
    },
  });
  if (existing) throw new Error('Teacher is already assigned to this class subject for this academic year.');

  const assignment = await prisma.teacherAssignment.create({
    data: {
      tenantId,
      teacherProfileId,
      classSubjectId,
      academicYearId,
    },
    include: {
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      classSubject: {
        include: {
          section: { select: { name: true } },
          subject: { select: { name: true } },
        },
      },
      academicYear: { select: { name: true } },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'ASSIGN_TEACHER',
    entityType: 'TEACHER_ASSIGNMENT',
    entityId: assignment.id,
    newValues: { teacherProfileId, classSubjectId, academicYearId },
    req,
  });

  return assignment;
}
