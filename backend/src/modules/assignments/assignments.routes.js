import { Router } from 'express';
import {
  createAssignmentController,
  listAssignmentsController,
  getAssignmentController,
  submitAssignmentController,
  listSubmissionsController,
  gradeSubmissionController,
  createLearningMaterialController,
  listLearningMaterialsController,
} from './assignments.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Learning Materials
router.get('/materials', listLearningMaterialsController);
router.post('/materials', requirePermission('assignments.manage'), createLearningMaterialController);

// Assignments
router.get('/', listAssignmentsController);
router.post('/', requirePermission('assignments.manage'), createAssignmentController);
router.get('/:id', getAssignmentController);

// Assignment Submissions & Grading
router.post('/:id/submit', submitAssignmentController);
router.get('/:id/submissions', requirePermission('assignments.manage'), listSubmissionsController);
router.patch('/submissions/:submissionId/grade', requirePermission('assignments.manage'), gradeSubmissionController);

export default router;
