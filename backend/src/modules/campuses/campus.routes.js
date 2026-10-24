import { Router } from 'express';
import {
  getAllCampuses,
  getCampus,
  addCampus,
  editCampus,
} from './campus.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Authenticated users in the tenant can view campuses
router.get('/', getAllCampuses);
router.get('/:id', getCampus);

// Management restricted to School Admin and Principal
router.post('/', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addCampus);
router.put('/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), editCampus);

export default router;
