import {
  recordSectionAttendance,
  getSectionAttendanceByDate,
  correctStudentAttendance,
  getStudentAttendanceSummary,
  getSectionDailyStats,
  applyStaffLeaveRequest,
  reviewStaffLeaveRequest,
  listLeaveRequests,
} from './attendance.service.js';
import {
  recordDailyAttendanceSchema,
  updateSingleAttendanceSchema,
  applyStaffLeaveSchema,
  reviewStaffLeaveSchema,
} from './attendance.schema.js';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '../../utils/response.js';
import { prisma } from '../../db/prisma.js';

export async function submitDailyAttendance(req, res, next) {
  try {
    const validated = recordDailyAttendanceSchema.parse(req.body);
    const results = await recordSectionAttendance(req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, results, `Attendance recorded for ${results.length} students`);
  } catch (error) {
    next(error);
  }
}

export async function getSectionAttendance(req, res, next) {
  try {
    const { sectionId } = req.params;
    const { date = new Date().toISOString().slice(0, 10) } = req.query;
    const records = await getSectionAttendanceByDate(req.tenantId, sectionId, date);
    return sendSuccess(res, records, 'Daily attendance records retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateSingleAttendanceSchema.parse(req.body);
    const updated = await correctStudentAttendance(req.tenantId, id, validated, req.user.id, req);
    return sendSuccess(res, updated, 'Attendance record updated and audit log recorded');
  } catch (error) {
    next(error);
  }
}

export async function getStudentSummary(req, res, next) {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Student role validation: can only view self
    if (req.roles.includes('STUDENT') && !req.roles.includes('SCHOOL_ADMIN') && !req.roles.includes('PRINCIPAL') && !req.user.isSuperAdmin) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!student || student.id !== studentId) {
        return sendError(res, 'Access denied. You can only view your own attendance records.', 403);
      }
    }

    // Parent role validation: can only view linked child
    if (req.roles.includes('PARENT') && !req.roles.includes('SCHOOL_ADMIN') && !req.roles.includes('PRINCIPAL') && !req.user.isSuperAdmin) {
      const parent = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
      if (!parent) return sendError(res, 'Parent profile not found.', 403);

      const linked = await prisma.studentParent.findFirst({
        where: { tenantId: req.tenantId, parentProfileId: parent.id, studentId },
      });
      if (!linked) {
        return sendError(res, 'Access denied. You can only view attendance for your linked children.', 403);
      }
    }

    const summary = await getStudentAttendanceSummary(req.tenantId, studentId, { startDate, endDate });
    return sendSuccess(res, summary, 'Student attendance summary calculated');
  } catch (error) {
    next(error);
  }
}

export async function getSectionStats(req, res, next) {
  try {
    const { sectionId } = req.params;
    const { date = new Date().toISOString().slice(0, 10) } = req.query;
    const stats = await getSectionDailyStats(req.tenantId, sectionId, date);
    return sendSuccess(res, stats, 'Section daily attendance statistics calculated');
  } catch (error) {
    next(error);
  }
}

export async function applyLeave(req, res, next) {
  try {
    const validated = applyStaffLeaveSchema.parse(req.body);
    const leave = await applyStaffLeaveRequest(req.tenantId, req.user.id, validated, req);
    return sendCreated(res, leave, 'Leave request submitted successfully');
  } catch (error) {
    next(error);
  }
}

export async function reviewLeave(req, res, next) {
  try {
    const { id } = req.params;
    const validated = reviewStaffLeaveSchema.parse(req.body);
    const reviewed = await reviewStaffLeaveRequest(req.tenantId, id, validated, req.user.id, req);
    return sendSuccess(res, reviewed, `Leave request marked as ${validated.status}`);
  } catch (error) {
    next(error);
  }
}

export async function getAllLeaves(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { leaves, total } = await listLeaveRequests(req.tenantId, { status, page, limit });
    return sendPaginated(res, leaves, total, page, limit, 'Leave requests retrieved');
  } catch (error) {
    next(error);
  }
}
