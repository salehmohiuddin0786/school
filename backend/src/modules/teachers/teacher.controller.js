import {
  listTeachers,
  getTeacherById,
  createTeacher,
  updateTeacherDetails,
} from './teacher.service.js';
import { createTeacherSchema, updateTeacherSchema } from './teacher.schema.js';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '../../utils/response.js';
import { prisma } from '../../db/prisma.js';

export async function getAllTeachers(req, res, next) {
  try {
    const { search, campusId, page = 1, limit = 20 } = req.query;
    const { teachers, total } = await listTeachers(req.tenantId, { search, campusId, page, limit });
    return sendPaginated(res, teachers, total, page, limit, 'Teachers retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getTeacher(req, res, next) {
  try {
    const { id } = req.params;
    const teacher = await getTeacherById(id, req.tenantId);
    if (!teacher) return sendError(res, 'Teacher profile not found', 404);
    return sendSuccess(res, teacher, 'Teacher profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(req, res, next) {
  try {
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!teacherProfile) {
      return sendError(res, 'No teacher profile linked to your user account', 404);
    }
    const fullTeacher = await getTeacherById(teacherProfile.id, req.tenantId);
    return sendSuccess(res, fullTeacher, 'Faculty profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function addTeacher(req, res, next) {
  try {
    const validated = createTeacherSchema.parse(req.body);
    const teacher = await createTeacher(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, teacher, 'Teacher registered successfully');
  } catch (error) {
    next(error);
  }
}

export async function editTeacher(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateTeacherSchema.parse(req.body);
    const updated = await updateTeacherDetails(id, req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, updated, 'Teacher profile updated');
  } catch (error) {
    next(error);
  }
}
