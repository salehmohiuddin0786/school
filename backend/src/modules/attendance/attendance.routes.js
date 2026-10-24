import { Router } from 'express';
import {
  submitDailyAttendance,
  getSectionAttendance,
  updateAttendance,
  getStudentSummary,
  getSectionStats,
  applyLeave,
  reviewLeave,
  getAllLeaves,
} from './attendance.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Student Attendance
router.post('/record', requirePermission('attendance.mark'), submitDailyAttendance);
router.get('/section/:sectionId', requirePermission('attendance.read'), getSectionAttendance);
router.get('/section/:sectionId/stats', requirePermission('attendance.read'), getSectionStats);
router.put('/:id', requirePermission('attendance.approve'), updateAttendance);
router.get('/student/:studentId/summary', getStudentSummary);

// Staff Leaves
router.post('/leaves/apply', applyLeave);
router.patch('/leaves/:id/review', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), reviewLeave);
router.get('/leaves', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_MANAGER'), getAllLeaves);

export default router;
