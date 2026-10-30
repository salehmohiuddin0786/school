import { Router } from 'express';
import {
  dispatchNotificationController,
  triggerAbsenteeAlertController,
  triggerFeeDueReminderController,
  triggerFeeReceiptController,
  listNotificationsController,
  getStatsController,
} from './notification.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Metrics & Log inspection
router.get('/stats', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), getStatsController);
router.get('/', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), listNotificationsController);

// Manual or API outbound dispatch
router.post('/dispatch', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), dispatchNotificationController);

// Automated Domain Event Webhooks & Triggers
router.post('/triggers/absentee', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'SUPER_ADMIN'), triggerAbsenteeAlertController);
router.post('/triggers/fee-due', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'SUPER_ADMIN'), triggerFeeDueReminderController);
router.post('/triggers/fee-receipt', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'SUPER_ADMIN'), triggerFeeReceiptController);

export default router;
