import { Router } from 'express';
import {
  addTimetableEntry,
  getSectionSchedule,
  getTeacherSchedule,
  getMyStudentSchedule,
  removeTimetableEntry,
  assignTeacher,
} from './timetable.controller.js';
import {
  createSubstitutionController,
  cancelSubstitutionController,
  listSubstitutionsController,
  getEffectiveTimetableController,
} from './substitution.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Student schedule for currently logged-in student
router.get('/my-schedule', requireRole('STUDENT'), getMyStudentSchedule);

// Timetable views by section or teacher
router.get('/section/:sectionId', getSectionSchedule);
router.get('/section/:sectionId/effective', getEffectiveTimetableController);
router.get('/teacher/:teacherProfileId', getTeacherSchedule);

// Teacher Substitutions
router.get('/substitutions', listSubstitutionsController);
router.post('/substitutions', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), createSubstitutionController);
router.patch('/substitutions/:id/cancel', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), cancelSubstitutionController);

// Management routes
router.post('/assignments', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), assignTeacher);
router.post('/entries', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addTimetableEntry);
router.delete('/entries/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), removeTimetableEntry);

export default router;
