import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

function isTimeOverlapping(s1, e1, s2, e2) {
  return s1 < e2 && e1 > s2;
}

/**
 * Assigns an eligible substitute teacher to a specific timetable entry for a specific date.
 */
export async function assignSubstitution(tenantId, data, assignedById = null, req = null) {
  const timetableEntry = await prisma.timetableEntry.findFirst({
    where: { id: data.timetableEntryId, tenantId },
    include: {
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  });

  if (!timetableEntry) {
    const err = new Error('Timetable entry not found.');
    err.statusCode = 404;
    throw err;
  }

  if (timetableEntry.teacherProfileId === data.substituteTeacherId) {
    const err = new Error('Substitute teacher cannot be the same as the original scheduled teacher.');
    err.statusCode = 400;
    throw err;
  }

  const substituteTeacher = await prisma.teacherProfile.findFirst({
    where: { id: data.substituteTeacherId, tenantId },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  if (!substituteTeacher) {
    const err = new Error('Substitute teacher not found in your institution.');
    err.statusCode = 404;
    throw err;
  }

  const dateObj = new Date(data.date);

  // 1. Conflict Check: Substitute teacher recurring timetable on this day of week
  const dayOfWeek = timetableEntry.dayOfWeek;
  const recurringSlots = await prisma.timetableEntry.findMany({
    where: {
      tenantId,
      teacherProfileId: data.substituteTeacherId,
      dayOfWeek,
    },
    include: {
      section: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  for (const slot of recurringSlots) {
    if (isTimeOverlapping(timetableEntry.startTime, timetableEntry.endTime, slot.startTime, slot.endTime)) {
      const subName = `${substituteTeacher.user.firstName} ${substituteTeacher.user.lastName}`;
      const err = new Error(
        `Substitute teacher ${subName} has a conflicting class (${slot.subject.name} - ${slot.section.name}) from ${slot.startTime} to ${slot.endTime}.`
      );
      err.statusCode = 409;
      throw err;
    }
  }

  // 2. Conflict Check: Existing active substitutions for the substitute teacher on this date
  const activeSubstitutions = await prisma.teacherSubstitution.findMany({
    where: {
      tenantId,
      substituteTeacherId: data.substituteTeacherId,
      date: dateObj,
      status: 'ASSIGNED',
    },
    include: {
      timetableEntry: {
        include: {
          section: { select: { name: true } },
          subject: { select: { name: true } },
        },
      },
    },
  });

  for (const sub of activeSubstitutions) {
    if (
      isTimeOverlapping(
        timetableEntry.startTime,
        timetableEntry.endTime,
        sub.timetableEntry.startTime,
        sub.timetableEntry.endTime
      )
    ) {
      const subName = `${substituteTeacher.user.firstName} ${substituteTeacher.user.lastName}`;
      const err = new Error(
        `Substitute teacher ${subName} is already assigned as a substitute for ${sub.timetableEntry.subject.name} from ${sub.timetableEntry.startTime} to ${sub.timetableEntry.endTime}.`
      );
      err.statusCode = 409;
      throw err;
    }
  }

  // 3. Prevent duplicate active substitution for the same slot on the same date
  const existingSlotSub = await prisma.teacherSubstitution.findFirst({
    where: {
      tenantId,
      timetableEntryId: data.timetableEntryId,
      date: dateObj,
      status: 'ASSIGNED',
    },
  });

  if (existingSlotSub) {
    const err = new Error('A substitute teacher is already assigned to this period on this date.');
    err.statusCode = 409;
    throw err;
  }

  // 4. Create the substitution record
  const substitution = await prisma.teacherSubstitution.create({
    data: {
      tenantId,
      timetableEntryId: data.timetableEntryId,
      originalTeacherId: timetableEntry.teacherProfileId,
      substituteTeacherId: data.substituteTeacherId,
      date: dateObj,
      status: 'ASSIGNED',
      remarks: data.remarks || null,
      assignedById,
    },
    include: {
      timetableEntry: {
        include: {
          section: { select: { name: true } },
          subject: { select: { name: true, code: true } },
        },
      },
      originalTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      substituteTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  await logAudit({
    tenantId,
    userId: assignedById,
    action: 'ASSIGN_TEACHER_SUBSTITUTION',
    entityType: 'TEACHER_SUBSTITUTION',
    entityId: substitution.id,
    newValues: {
      date: data.date,
      timetableEntryId: data.timetableEntryId,
      originalTeacher: `${timetableEntry.teacher.user.firstName} ${timetableEntry.teacher.user.lastName}`,
      substituteTeacher: `${substituteTeacher.user.firstName} ${substituteTeacher.user.lastName}`,
    },
    req,
  });

  return substitution;
}

/**
 * Cancels an active teacher substitution and restores the recurring schedule.
 */
export async function cancelSubstitution(tenantId, substitutionId, cancelledById = null, remarks = null, req = null) {
  const existing = await prisma.teacherSubstitution.findFirst({
    where: { id: substitutionId, tenantId },
    include: {
      timetableEntry: true,
      originalTeacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      substituteTeacher: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!existing) {
    const err = new Error('Substitution record not found.');
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.teacherSubstitution.update({
    where: { id: substitutionId },
    data: {
      status: 'CANCELLED',
      remarks: remarks || existing.remarks,
    },
  });

  await logAudit({
    tenantId,
    userId: cancelledById,
    action: 'CANCEL_TEACHER_SUBSTITUTION',
    entityType: 'TEACHER_SUBSTITUTION',
    entityId: substitutionId,
    oldValues: { status: existing.status },
    newValues: { status: 'CANCELLED', remarks },
    req,
  });

  return updated;
}

/**
 * Lists substitutions with date and status filters.
 */
export async function listSubstitutions(tenantId, { date = null, status = 'ASSIGNED', teacherId = null } = {}) {
  const where = { tenantId };
  if (status) where.status = status;
  if (date) where.date = new Date(date);
  if (teacherId) {
    where.OR = [
      { originalTeacherId: teacherId },
      { substituteTeacherId: teacherId },
    ];
  }

  return prisma.teacherSubstitution.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      timetableEntry: {
        include: {
          section: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, code: true } },
          classRoom: { select: { id: true, roomNumber: true } },
        },
      },
      originalTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      substituteTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });
}

/**
 * Returns effective section timetable for a specific date, overlaying active substitutions.
 */
export async function getEffectiveSectionTimetable(sectionId, dateStr, tenantId) {
  const dateObj = new Date(dateStr);
  let dayOfWeek = dateObj.getDay(); // 0 is Sunday
  if (dayOfWeek === 0) dayOfWeek = 7;

  // 1. Fetch recurring timetable for this section and day of week
  const entries = await prisma.timetableEntry.findMany({
    where: {
      sectionId,
      tenantId,
      dayOfWeek,
    },
    orderBy: { startTime: 'asc' },
    include: {
      subject: { select: { id: true, code: true, name: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      classRoom: { select: { id: true, roomNumber: true } },
    },
  });

  // 2. Fetch active substitutions on this date for this tenant
  const substitutions = await prisma.teacherSubstitution.findMany({
    where: {
      tenantId,
      date: dateObj,
      status: 'ASSIGNED',
      timetableEntryId: { in: entries.map((e) => e.id) },
    },
    include: {
      substituteTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      originalTeacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  const subMap = new Map();
  substitutions.forEach((s) => subMap.set(s.timetableEntryId, s));

  // 3. Merge substitutions onto recurring schedule
  return entries.map((entry) => {
    const sub = subMap.get(entry.id);
    if (sub) {
      return {
        ...entry,
        isSubstituted: true,
        effectiveTeacher: sub.substituteTeacher,
        originalTeacher: entry.teacher,
        substitutionId: sub.id,
        remarks: sub.remarks,
      };
    }
    return {
      ...entry,
      isSubstituted: false,
      effectiveTeacher: entry.teacher,
      originalTeacher: entry.teacher,
      substitutionId: null,
    };
  });
}

/**
 * Checks if a teacher is authorized to mark attendance for a section on a given date
 * (either assigned class teacher OR authorized substitute).
 */
export async function verifyTeacherAttendanceAuthorization(tenantId, teacherUserId, sectionId, dateStr) {
  const teacherProfile = await prisma.teacherProfile.findFirst({
    where: { userId: teacherUserId, tenantId },
  });

  if (!teacherProfile) return false;

  // 1. Check if assigned class teacher
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      tenantId,
      teacherProfileId: teacherProfile.id,
      classSubject: { sectionId },
    },
  });

  if (assignment) return true;

  // 1b. Check if teacher has recurring timetable entry for this section
  const timetableSlot = await prisma.timetableEntry.findFirst({
    where: {
      tenantId,
      teacherProfileId: teacherProfile.id,
      sectionId,
    },
  });

  if (timetableSlot) return true;

  // 2. Check if authorized substitute teacher on this date
  const dateObj = new Date(dateStr);
  const substitution = await prisma.teacherSubstitution.findFirst({
    where: {
      tenantId,
      substituteTeacherId: teacherProfile.id,
      date: dateObj,
      status: { in: ['ASSIGNED', 'ACTIVE'] },
      timetableEntry: { sectionId },
    },
  });

  return !!substitution;
}
