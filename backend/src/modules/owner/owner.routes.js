import { Router } from 'express';
import {
  getOverview,
  listStudents,
  listTeachers,
} from './owner.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

router.get('/overview', requireRole('OWNER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), getOverview);
router.get('/students', requireRole('OWNER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), listStudents);
router.get('/teachers', requireRole('OWNER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), listTeachers);

export default router;
