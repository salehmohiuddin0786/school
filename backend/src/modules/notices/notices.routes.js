import { Router } from 'express';
import {
  createNoticeController,
  listNoticesController,
  getNoticeController,
} from './notices.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

router.get('/', listNoticesController);
router.get('/:id', getNoticeController);
router.post('/', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), createNoticeController);

export default router;
