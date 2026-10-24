import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

export async function recordSectionAttendance(tenantId, { sectionId, date, records }, recordedById = null, req = null) {
  const section = await prisma.section.findFirst({ where: { id: sectionId, tenantId } });
  if (!section) throw new Error('Section not found.');

  const dateObj = new Date(date);

  const results = await prisma.$transaction(async (tx) => {
    const updatedRecords = [];

    for (const item of records) {
      // Find existing by composite unique
      const existing = await tx.studentAttendance.findFirst({
        where: {
          tenantId,
          studentId: item.studentId,
          sectionId,
          date: dateObj,
        },
      });

      if (existing) {
        const updated = await tx.studentAttendance.update({
          where: { id: existing.id },
          data: {
            status: item.status,
            remarks: item.remarks || null,
            recordedById,
          },
        });
        updatedRecords.push(updated);
      } else {
        const created = await tx.studentAttendance.create({
          data: {
            tenantId,
            studentId: item.studentId,
            sectionId,
            date: dateObj,
            status: item.status,
            remarks: item.remarks || null,
            recordedById,
          },
        });
        updatedRecords.push(created);
      }
    }

    return updatedRecords;
  });

  await logAudit({
    tenantId,
    userId: recordedById,
    action: 'RECORD_ATTENDANCE',
    entityType: 'STUDENT_ATTENDANCE',
    newValues: { sectionId, date, totalRecords: records.length },
    req,
  });

  return results;
}

export async function getSectionAttendanceByDate(tenantId, sectionId, date) {
  const dateObj = new Date(date);

  return prisma.studentAttendance.findMany({
    where: {
      tenantId,
      sectionId,
      date: dateObj,
    },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
}

export async function correctStudentAttendance(tenantId, id, { status, remarks }, authorizedUserId = null, req = null) {
  const existing = await prisma.studentAttendance.findFirst({
    where: { id, tenantId },
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!existing) throw new Error('Attendance record not found.');

  const updated = await prisma.studentAttendance.update({
    where: { id },
    data: {
      status,
      remarks,
    },
  });

  // Log authorized adjustment to audit log for compliance
  await logAudit({
    tenantId,
    userId: authorizedUserId,
    action: 'CORRECT_ATTENDANCE',
    entityType: 'STUDENT_ATTENDANCE',
    entityId: id,
    oldValues: { status: existing.status, remarks: existing.remarks },
    newValues: { status, remarks },
    req,
  });

  return updated;
}

export async function getStudentAttendanceSummary(tenantId, studentId, { startDate, endDate } = {}) {
  const where = { tenantId, studentId };

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const attendances = await prisma.studentAttendance.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  const totalDays = attendances.length;
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let halfDays = 0;
  let excusedDays = 0;

  attendances.forEach((a) => {
    if (a.status === 'PRESENT') presentDays++;
    else if (a.status === 'ABSENT') absentDays++;
    else if (a.status === 'LATE') lateDays++;
    else if (a.status === 'HALF_DAY') halfDays++;
    else if (a.status === 'EXCUSED') excusedDays++;
  });

  // Calculation formula: (present + excused + late*0.5 + half_day*0.5) / total * 100
  const effectivePresent = presentDays + excusedDays + lateDays * 0.5 + halfDays * 0.5;
  const percentage = totalDays > 0 ? Number(((effectivePresent / totalDays) * 100).toFixed(1)) : 100.0;

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    halfDays,
    excusedDays,
    percentage,
    status: percentage >= 75.0 ? 'SATISFACTORY' : 'ATTENDANCE_DEFICIENT',
    records: attendances,
  };
}

export async function getSectionDailyStats(tenantId, sectionId, date) {
  const dateObj = new Date(date);

  const [totalEnrolled, attendances] = await Promise.all([
    prisma.enrollment.count({
      where: { tenantId, sectionId, status: 'ACTIVE' },
    }),
    prisma.studentAttendance.findMany({
      where: { tenantId, sectionId, date: dateObj },
    }),
  ]);

  let present = 0;
  let absent = 0;
  let late = 0;

  attendances.forEach((a) => {
    if (a.status === 'PRESENT') present++;
    else if (a.status === 'ABSENT') absent++;
    else if (a.status === 'LATE') late++;
  });

  const markedCount = attendances.length;
  const attendanceRate = markedCount > 0 ? Number(((present / markedCount) * 100).toFixed(1)) : 0;

  return {
    date,
    totalEnrolled,
    markedCount,
    present,
    absent,
    late,
    attendanceRate,
  };
}

// -------------------------------------------------------------
// STAFF LEAVES & APPROVALS
// -------------------------------------------------------------
export async function applyStaffLeaveRequest(tenantId, userId, { leaveType, startDate, endDate, reason }, req = null) {
  // Find TeacherProfile or StaffProfile
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId } });
  const staff = await prisma.staffProfile.findUnique({ where: { userId } });

  if (!teacher && !staff) {
    throw new Error('User is not registered as a faculty or staff member.');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      tenantId,
      teacherProfileId: teacher ? teacher.id : null,
      staffProfileId: staff ? staff.id : null,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: 'PENDING',
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'APPLY_LEAVE',
    entityType: 'LEAVE_REQUEST',
    entityId: leaveRequest.id,
    newValues: { leaveType, totalDays, startDate, endDate },
    req,
  });

  return leaveRequest;
}

export async function reviewStaffLeaveRequest(tenantId, leaveRequestId, { status, approvalRemarks }, reviewerUserId = null, req = null) {
  const existing = await prisma.leaveRequest.findFirst({
    where: { id: leaveRequestId, tenantId },
  });
  if (!existing) throw new Error('Leave request not found.');

  const updated = await prisma.$transaction(async (tx) => {
    const reviewed = await tx.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status,
        approvalRemarks: approvalRemarks || null,
        approvedById: reviewerUserId,
      },
    });

    // If approved and staff profile exists, update usedDays in leave balance
    if (status === 'APPROVED' && existing.staffProfileId) {
      await tx.staffLeaveBalance.updateMany({
        where: {
          tenantId,
          staffProfileId: existing.staffProfileId,
          leaveType: existing.leaveType,
        },
        data: {
          usedDays: { increment: existing.totalDays },
        },
      });
    }

    return reviewed;
  });

  await logAudit({
    tenantId,
    userId: reviewerUserId,
    action: 'REVIEW_LEAVE',
    entityType: 'LEAVE_REQUEST',
    entityId: leaveRequestId,
    newValues: { status, approvalRemarks },
    req,
  });

  return updated;
}

export async function listLeaveRequests(tenantId, { status, page = 1, limit = 20 }) {
  const where = { tenantId };
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [leaves, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { leaves, total };
}
