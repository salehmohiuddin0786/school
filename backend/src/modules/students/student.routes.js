import { Router } from 'express';
import {
  getAllStudents,
  getStudent,
  admitNewStudent,
  editStudent,
  enrollStudent,
} from './student.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Student directory list (requires students.read permission)
router.get('/', requirePermission('students.read'), getAllStudents);

// Student profile details (protected by role-based own-record/child validation in controller)
router.get('/:id', getStudent);

// Student admission (requires students.create permission)
router.post('/admit', requirePermission('students.create'), admitNewStudent);

// Student update (requires students.update permission)
router.put('/:id', requirePermission('students.update'), editStudent);

// Student enrollment into a section
router.post('/:id/enroll', requirePermission('students.update'), enrollStudent);

export default router;
