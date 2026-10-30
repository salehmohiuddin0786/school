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
  getMyTeacherAttendance,
  submitPeriodAttendance,
  getPeriodAttendanceReport,
} from './attendance.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Teacher Self-Attendance (Read-Only)
router.get('/my-attendance', requireRole('TEACHER'), getMyTeacherAttendance);

// Student Attendance (Daily)
router.post('/record', requirePermission('attendance.mark'), submitDailyAttendance);
router.get('/section/:sectionId', requirePermission('attendance.read'), getSectionAttendance);
router.get('/section/:sectionId/stats', requirePermission('attendance.read'), getSectionStats);
router.put('/:id', requirePermission('attendance.approve'), updateAttendance);
router.get('/student/:studentId/summary', getStudentSummary);

// Period-Wise Attendance (Subject/Class Slot)
router.post('/period', requirePermission('attendance.mark'), submitPeriodAttendance);
router.get('/period/:timetableEntryId/date/:date', requirePermission('attendance.read'), getPeriodAttendanceReport);

// Staff Leaves
router.post('/leaves/apply', applyLeave);
router.patch('/leaves/:id/review', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), reviewLeave);
router.get('/leaves', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_MANAGER'), getAllLeaves);

export default router;
