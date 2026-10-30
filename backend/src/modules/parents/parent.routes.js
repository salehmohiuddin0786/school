import { Router } from 'express';
import {
  getAllParents,
  getParent,
  addParent,
  linkChild,
  getMyChildren,
  getChildDashboard,
} from './parent.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Authenticated Parent fetching their own verified linked children and child overviews
router.get('/my-children', requireRole('PARENT'), getMyChildren);
router.get('/my-children/:studentId/overview', requireRole('PARENT'), getChildDashboard);

// Staff directory routes
router.get('/', requirePermission('students.read'), getAllParents);
router.get('/:id', requirePermission('students.read'), getParent);
router.post('/', requirePermission('students.create'), addParent);
router.post('/:id/link-student', requirePermission('students.create'), linkChild);

export default router;
