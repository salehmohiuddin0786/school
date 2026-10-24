import { Router } from 'express';
import {
  getAllTenants,
  getCurrentTenant,
  getTenant,
  createTenant,
  updateTenant,
  setTenantStatus,
} from './tenant.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope } from '../../middleware/tenantScope.js';
import { requireSuperAdmin, requireRole } from '../../middleware/authorize.js';

const router = Router();

// All tenant routes require authentication and tenant resolution
router.use(authenticate, tenantScope);

// Current tenant for authenticated users
router.get('/current', getCurrentTenant);

// Platform Super Admin routes
router.get('/', requireSuperAdmin, getAllTenants);
router.post('/', requireSuperAdmin, createTenant);
router.patch('/:id/status', requireSuperAdmin, setTenantStatus);

// Single tenant read & update
router.get('/:id', getTenant);
router.put('/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), updateTenant);

export default router;
