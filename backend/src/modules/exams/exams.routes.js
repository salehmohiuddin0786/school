import { Router } from 'express';
import {
  createExamController,
  listExamsController,
  getExamController,
  scheduleSubjectController,
  enterMarksController,
  getMarksSheetController,
  publishResultsController,
  getReportCardController,
  getOfficialReportCardController,
  createGradeScaleController,
  listGradeScalesController,
} from './exams.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Grade scales
router.get('/grade-scales', requirePermission('exams.read'), listGradeScalesController);
router.post('/grade-scales', requirePermission('exams.manage'), createGradeScaleController);

// Exam schedules and assessments
router.get('/', requirePermission('exams.read'), listExamsController);
router.post('/', requirePermission('exams.manage'), createExamController);
router.get('/:id', requirePermission('exams.read'), getExamController);

// Exam subjects scheduling
router.post('/:examId/subjects', requirePermission('exams.manage'), scheduleSubjectController);

// Marks entry and marks sheet
router.get('/subjects/:examSubjectId/marks', requirePermission('exams.read'), getMarksSheetController);
router.post('/subjects/:examSubjectId/marks', requirePermission('marks.enter'), enterMarksController);

// Results publishing & report cards
router.post('/:examId/publish', requirePermission('results.publish'), publishResultsController);
router.get('/:examId/report-cards/:studentId', requirePermission('exams.read'), getReportCardController);
router.get('/:examId/report-cards/:studentId/official', requirePermission('exams.read'), getOfficialReportCardController);

export default router;
