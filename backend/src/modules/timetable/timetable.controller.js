import {
  createTimetableEntry,
  getSectionTimetable,
  getTeacherTimetable,
  deleteTimetableEntry,
  assignTeacherToSubject,
} from './timetable.service.js';
import {
  createTimetableEntrySchema,
  assignTeacherSchema,
} from './timetable.schema.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js';
import { prisma } from '../../db/prisma.js';

export async function addTimetableEntry(req, res, next) {
  try {
    const validated = createTimetableEntrySchema.parse(req.body);
    const entry = await createTimetableEntry(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, entry, 'Timetable entry scheduled successfully');
  } catch (error) {
    next(error);
  }
}

export async function getSectionSchedule(req, res, next) {
  try {
    const { sectionId } = req.params;
    const schedule = await getSectionTimetable(sectionId, req.tenantId);
    return sendSuccess(res, schedule, 'Class timetable retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getTeacherSchedule(req, res, next) {
  try {
    const { teacherProfileId } = req.params;
    const schedule = await getTeacherTimetable(teacherProfileId, req.tenantId);
    return sendSuccess(res, schedule, 'Teacher timetable retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getMyStudentSchedule(req, res, next) {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: {
        enrollments: {
          take: 1,
          orderBy: { enrollmentDate: 'desc' },
        },
      },
    });

    if (!student || student.enrollments.length === 0) {
      return sendError(res, 'Student is not currently enrolled in any class section', 404);
    }

    const sectionId = student.enrollments[0].sectionId;
    const schedule = await getSectionTimetable(sectionId, req.tenantId);
    return sendSuccess(res, schedule, 'Student timetable retrieved');
  } catch (error) {
    next(error);
  }
}

export async function removeTimetableEntry(req, res, next) {
  try {
    const { id } = req.params;
    await deleteTimetableEntry(id, req.tenantId, req.user.id, req);
    return sendSuccess(res, null, 'Timetable entry deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function assignTeacher(req, res, next) {
  try {
    const validated = assignTeacherSchema.parse(req.body);
    const assignment = await assignTeacherToSubject(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, assignment, 'Teacher assigned to class subject successfully');
  } catch (error) {
    next(error);
  }
}
