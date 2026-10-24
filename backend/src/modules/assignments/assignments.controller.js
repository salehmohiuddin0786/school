import {
  createAssignment,
  listAssignments,
  getAssignmentById,
  submitAssignment,
  listSubmissions,
  gradeSubmission,
  createLearningMaterial,
  listLearningMaterials,
} from './assignments.service.js';
import {
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
  createLearningMaterialSchema,
} from './assignments.schema.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js';
import { prisma } from '../../db/prisma.js';

export async function createAssignmentController(req, res, next) {
  try {
    const validated = createAssignmentSchema.parse(req.body);
    const assignment = await createAssignment(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, assignment, 'Assignment created successfully');
  } catch (error) {
    next(error);
  }
}

export async function listAssignmentsController(req, res, next) {
  try {
    const { classSubjectId, teacherProfileId } = req.query;

    let studentId = null;
    if (req.roles.includes('STUDENT')) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (student) studentId = student.id;
    }

    const assignments = await listAssignments(req.tenantId, {
      classSubjectId,
      teacherProfileId,
      studentId,
    });
    return sendSuccess(res, assignments, 'Assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getAssignmentController(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await getAssignmentById(id, req.tenantId);
    if (!assignment) {
      return sendError(res, 'Assignment not found in your institution.', 404);
    }
    return sendSuccess(res, assignment, 'Assignment details retrieved');
  } catch (error) {
    next(error);
  }
}

export async function submitAssignmentController(req, res, next) {
  try {
    const { id } = req.params;
    const validated = submitAssignmentSchema.parse(req.body);

    // Resolve student
    let studentId = req.body.studentId;
    if (req.roles.includes('STUDENT')) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!student) {
        return sendError(res, 'Student profile not found for active user.', 403);
      }
      studentId = student.id;
    }

    if (!studentId) {
      return sendError(res, 'Student ID is required.', 400);
    }

    const submission = await submitAssignment(req.tenantId, id, studentId, validated, req);
    return sendCreated(res, submission, 'Assignment submitted successfully');
  } catch (error) {
    next(error);
  }
}

export async function listSubmissionsController(req, res, next) {
  try {
    const { id } = req.params;
    const submissions = await listSubmissions(req.tenantId, id);
    return sendSuccess(res, submissions, 'Submissions retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function gradeSubmissionController(req, res, next) {
  try {
    const { submissionId } = req.params;
    const validated = gradeSubmissionSchema.parse(req.body);
    const graded = await gradeSubmission(req.tenantId, submissionId, validated, req.user?.id, req);
    return sendSuccess(res, graded, 'Submission graded and feedback provided successfully');
  } catch (error) {
    next(error);
  }
}

export async function createLearningMaterialController(req, res, next) {
  try {
    const validated = createLearningMaterialSchema.parse(req.body);
    const material = await createLearningMaterial(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, material, 'Learning material published successfully');
  } catch (error) {
    next(error);
  }
}

export async function listLearningMaterialsController(req, res, next) {
  try {
    const { classSubjectId } = req.query;
    const materials = await listLearningMaterials(req.tenantId, { classSubjectId });
    return sendSuccess(res, materials, 'Learning materials retrieved successfully');
  } catch (error) {
    next(error);
  }
}
