import {
  createExam,
  listExams,
  getExamById,
  scheduleExamSubject,
  enterMarksBulk,
  getExamSubjectMarksSheet,
  calculateAndPublishResults,
  getStudentReportCard,
  generateComprehensiveReportCardDocument,
  createGradeScale,
  listGradeScales,
} from './exams.service.js';
import {
  createExamSchema,
  scheduleExamSubjectSchema,
  enterMarksBulkSchema,
  createGradeScaleSchema,
} from './exams.schema.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js';
import { prisma } from '../../db/prisma.js';

export async function createExamController(req, res, next) {
  try {
    const validated = createExamSchema.parse(req.body);
    const exam = await createExam(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, exam, 'Examination created successfully');
  } catch (error) {
    next(error);
  }
}

export async function listExamsController(req, res, next) {
  try {
    const { academicYearId } = req.query;
    const exams = await listExams(req.tenantId, academicYearId);
    return sendSuccess(res, exams, 'Exams retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getExamController(req, res, next) {
  try {
    const { id } = req.params;
    const exam = await getExamById(id, req.tenantId);
    if (!exam) {
      return sendError(res, 'Examination not found in your institution.', 404);
    }
    return sendSuccess(res, exam, 'Examination details retrieved');
  } catch (error) {
    next(error);
  }
}

export async function scheduleSubjectController(req, res, next) {
  try {
    const data = {
      ...req.body,
      examId: req.params.examId || req.body.examId,
    };
    const validated = scheduleExamSubjectSchema.parse(data);
    const scheduled = await scheduleExamSubject(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, scheduled, 'Subject scheduled for examination successfully');
  } catch (error) {
    next(error);
  }
}

export async function enterMarksController(req, res, next) {
  try {
    const data = {
      ...req.body,
      examSubjectId: req.params.examSubjectId || req.body.examSubjectId,
    };
    const validated = enterMarksBulkSchema.parse(data);
    const entries = await enterMarksBulk(req.tenantId, validated, req.user?.id, req);
    return sendSuccess(res, entries, 'Marks recorded successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMarksSheetController(req, res, next) {
  try {
    const { examSubjectId } = req.params;
    const marksSheet = await getExamSubjectMarksSheet(req.tenantId, examSubjectId);
    return sendSuccess(res, marksSheet, 'Exam marks sheet retrieved');
  } catch (error) {
    next(error);
  }
}

export async function publishResultsController(req, res, next) {
  try {
    const { examId } = req.params;
    const published = await calculateAndPublishResults(req.tenantId, examId, req.user?.id, req);
    return sendSuccess(res, published, 'Examination results published successfully with GPA and rankings');
  } catch (error) {
    next(error);
  }
}

export async function getReportCardController(req, res, next) {
  try {
    const { studentId, examId } = req.params;

    // Student self-check
    if (req.roles.includes('STUDENT') && !req.roles.includes('SCHOOL_ADMIN') && !req.roles.includes('PRINCIPAL') && !req.user.isSuperAdmin) {
      const selfStudent = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!selfStudent || selfStudent.id !== studentId) {
        return sendError(res, 'Access denied. You can only view your own report card.', 403);
      }
    }

    // Parent linked-child check
    if (req.roles.includes('PARENT') && !req.roles.includes('SCHOOL_ADMIN') && !req.roles.includes('PRINCIPAL') && !req.user.isSuperAdmin) {
      const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
      if (!parentProfile) {
        return sendError(res, 'Parent profile not found.', 403);
      }
      const linked = await prisma.studentParent.findFirst({
        where: {
          tenantId: req.tenantId,
          parentProfileId: parentProfile.id,
          studentId,
        },
      });
      if (!linked) {
        return sendError(res, 'Access denied. You can only view report cards of your verified children.', 403);
      }
    }

    const reportCard = await getStudentReportCard(req.tenantId, studentId, examId);
    return sendSuccess(res, reportCard, 'Report card retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getOfficialReportCardController(req, res, next) {
  try {
    const { studentId, examId } = req.params;

    // Student self-check
    if (req.roles.includes('STUDENT') && !req.roles.includes('SCHOOL_ADMIN') && !req.roles.includes('PRINCIPAL') && !req.user.isSuperAdmin) {
      const selfStudent = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!selfStudent || selfStudent.id !== studentId) {
        return sendError(res, 'Access denied. You can only view your own report card.', 403);
      }
    }

    // Parent linked-child check
    if (req.roles.includes('PARENT') && !req.roles.includes('SCHOOL_ADMIN') && !req.roles.includes('PRINCIPAL') && !req.user.isSuperAdmin) {
      const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
      if (!parentProfile) {
        return sendError(res, 'Parent profile not found.', 403);
      }
      const linked = await prisma.studentParent.findFirst({
        where: {
          tenantId: req.tenantId,
          parentProfileId: parentProfile.id,
          studentId,
        },
      });
      if (!linked) {
        return sendError(res, 'Access denied. You can only view report cards of your verified children.', 403);
      }
    }

    const officialDoc = await generateComprehensiveReportCardDocument(req.tenantId, studentId, examId);
    return sendSuccess(res, officialDoc, 'Official report card document generated successfully');
  } catch (error) {
    next(error);
  }
}

export async function createGradeScaleController(req, res, next) {
  try {
    const validated = createGradeScaleSchema.parse(req.body);
    const scale = await createGradeScale(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, scale, 'Grade scale created successfully');
  } catch (error) {
    next(error);
  }
}

export async function listGradeScalesController(req, res, next) {
  try {
    const scales = await listGradeScales(req.tenantId);
    return sendSuccess(res, scales, 'Grade scales retrieved successfully');
  } catch (error) {
    next(error);
  }
}
