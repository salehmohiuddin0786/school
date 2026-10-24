import {
  admitStudent,
  listStudents,
  getStudentById,
  updateStudentDetails,
  enrollStudentInSection,
} from './student.service.js';
import {
  admitStudentSchema,
  updateStudentSchema,
  enrollStudentSchema,
} from './student.schema.js';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '../../utils/response.js';
import { prisma } from '../../db/prisma.js';

export async function getAllStudents(req, res, next) {
  try {
    const { search, sectionId, courseId, campusId, gender, page = 1, limit = 20 } = req.query;
    const { students, total } = await listStudents(req.tenantId, {
      search,
      sectionId,
      courseId,
      campusId,
      gender,
      page,
      limit,
    });
    return sendPaginated(res, students, total, page, limit, 'Students retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getStudent(req, res, next) {
  try {
    const { id } = req.params;

    // Authorization checks:
    // 1. If user is a STUDENT, verify they are requesting their own profile
    if (req.roles.includes('STUDENT') && !req.roles.includes('SCHOOL_ADMIN') && !req.roles.includes('PRINCIPAL') && !req.user.isSuperAdmin) {
      const selfStudent = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!selfStudent || selfStudent.id !== id) {
        return sendError(res, 'Access denied. You can only view your own student record.', 403);
      }
    }

    // 2. If user is a PARENT, verify the student is a linked child
    if (req.roles.includes('PARENT') && !req.roles.includes('SCHOOL_ADMIN') && !req.roles.includes('PRINCIPAL') && !req.user.isSuperAdmin) {
      const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
      if (!parentProfile) {
        return sendError(res, 'Parent profile not found.', 403);
      }
      const linked = await prisma.studentParent.findFirst({
        where: {
          tenantId: req.tenantId,
          parentProfileId: parentProfile.id,
          studentId: id,
        },
      });
      if (!linked) {
        return sendError(res, 'Access denied. You can only view records of your verified linked children.', 403);
      }
    }

    const student = await getStudentById(id, req.tenantId);
    if (!student) {
      return sendError(res, 'Student not found in your institution.', 404);
    }

    return sendSuccess(res, student, 'Student profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function admitNewStudent(req, res, next) {
  try {
    const validated = admitStudentSchema.parse(req.body);
    const result = await admitStudent(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, result, 'Student admitted and registered successfully');
  } catch (error) {
    next(error);
  }
}

export async function editStudent(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateStudentSchema.parse(req.body);
    const updated = await updateStudentDetails(id, req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, updated, 'Student details updated');
  } catch (error) {
    next(error);
  }
}

export async function enrollStudent(req, res, next) {
  try {
    const { id } = req.params;
    const validated = enrollStudentSchema.parse(req.body);
    const enrollment = await enrollStudentInSection(req.tenantId, id, validated, req.user.id, req);
    return sendSuccess(res, enrollment, 'Student enrolled in class section successfully');
  } catch (error) {
    next(error);
  }
}
