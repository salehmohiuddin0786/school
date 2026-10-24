import { Router } from 'express';
import {
  getAllTeachers,
  getTeacher,
  getMyProfile,
  addTeacher,
  editTeacher,
} from './teacher.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Authenticated Teacher view own profile with schedules
router.get('/my-profile', requireRole('TEACHER'), getMyProfile);

// Faculty directory routes
router.get('/', getAllTeachers);
router.get('/:id', getTeacher);

// Management restricted to School Admin and Principal
router.post('/', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addTeacher);
router.put('/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), editTeacher);

export default router;
