import { Router } from 'express';
import {
  createFeeStructureController,
  listFeeStructuresController,
  createInvoiceController,
  listStudentInvoicesController,
  getInvoiceController,
  recordPaymentController,
  getFinancialMetricsController,
  createDiscountRuleController,
  listDiscountRulesController,
  evaluateDiscountController,
  reversePaymentController,
  getDayEndCashBookController,
  getDefaultersController,
  createGatewayOrderController,
  processGatewayWebhookController,
} from './fees.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Fee structures
router.get('/structures', listFeeStructuresController);
router.post('/structures', requireRole('SCHOOL_ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), createFeeStructureController);

// Invoices
router.post('/invoices', requireRole('SCHOOL_ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), createInvoiceController);
router.get('/invoices/:id', getInvoiceController);
router.get('/student/:studentId/invoices', listStudentInvoicesController);

// Payments & Collections (Counter POS)
router.post('/payments', requireRole('SCHOOL_ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), recordPaymentController);
router.post('/payments/:id/reverse', requireRole('SCHOOL_ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), reversePaymentController);

// Day-end Cash Book & Defaulter Reports
router.get('/cash-book/day-end', requireRole('SCHOOL_ADMIN', 'ACCOUNTANT', 'OWNER', 'SUPER_ADMIN'), getDayEndCashBookController);
router.get('/defaulters', requireRole('SCHOOL_ADMIN', 'ACCOUNTANT', 'OWNER', 'SUPER_ADMIN'), getDefaultersController);

// Discount & Sibling Concession Rules
router.post('/discounts/rules', requireRole('SCHOOL_ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), createDiscountRuleController);
router.get('/discounts/rules', listDiscountRulesController);
router.post('/discounts/evaluate', evaluateDiscountController);

// Online Payment Gateway Integration
router.post('/gateway/order', createGatewayOrderController);
router.post('/gateway/webhook', processGatewayWebhookController);

// Financial Metrics
router.get('/metrics', requireRole('SCHOOL_ADMIN', 'ACCOUNTANT', 'OWNER', 'SUPER_ADMIN'), getFinancialMetricsController);

export default router;
