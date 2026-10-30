import {
  createFeeStructure,
  listFeeStructures,
  createInvoice,
  listStudentInvoices,
  getInvoiceById,
  recordPayment,
  getFinancialSummaryMetrics,
  createFeeDiscountRule,
  listFeeDiscountRules,
  evaluateStudentDiscounts,
  reversePaymentWithVoucher,
  getDayEndCashBook,
  getFeeDefaultersList,
} from './fees.service.js';
import {
  createPaymentOrder,
  processGatewayPaymentSuccess,
} from './paymentGateway.service.js';
import {
  createFeeStructureSchema,
  createInvoiceSchema,
  recordPaymentSchema,
  createFeeDiscountRuleSchema,
  evaluateDiscountSchema,
  reversePaymentSchema,
  createGatewayOrderSchema,
  processWebhookSchema,
} from './fees.schema.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js';
import { prisma } from '../../db/prisma.js';

export async function createFeeStructureController(req, res, next) {
  try {
    const validated = createFeeStructureSchema.parse(req.body);
    const structure = await createFeeStructure(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, structure, 'Fee structure created successfully');
  } catch (error) {
    next(error);
  }
}

export async function listFeeStructuresController(req, res, next) {
  try {
    const { academicYearId } = req.query;
    const structures = await listFeeStructures(req.tenantId, academicYearId);
    return sendSuccess(res, structures, 'Fee structures retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createInvoiceController(req, res, next) {
  try {
    const validated = createInvoiceSchema.parse(req.body);
    const invoice = await createInvoice(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, invoice, 'Invoice generated successfully');
  } catch (error) {
    next(error);
  }
}

export async function listStudentInvoicesController(req, res, next) {
  try {
    const { studentId } = req.params;

    // Student self-check
    if (
      req.roles.includes('STUDENT') &&
      !req.roles.includes('SCHOOL_ADMIN') &&
      !req.roles.includes('ACCOUNTANT') &&
      !req.roles.includes('OWNER') &&
      !req.user?.isSuperAdmin
    ) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!student || student.id !== studentId) {
        return sendError(res, 'Access denied. You can only view your own fee invoices.', 403);
      }
    }

    // Parent linked-child check
    if (
      req.roles.includes('PARENT') &&
      !req.roles.includes('SCHOOL_ADMIN') &&
      !req.roles.includes('ACCOUNTANT') &&
      !req.roles.includes('OWNER') &&
      !req.user?.isSuperAdmin
    ) {
      const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
      if (!parentProfile) {
        return sendError(res, 'Parent profile not found.', 403);
      }
      const linked = await prisma.studentParent.findFirst({
        where: {
          tenantId: req.tenantId,
          parentProfileId: parentProfile.id,
          studentId,
        },
      });
      if (!linked) {
        return sendError(res, 'Access denied. You can only view invoices of your verified children.', 403);
      }
    }

    const invoices = await listStudentInvoices(req.tenantId, studentId);
    return sendSuccess(res, invoices, 'Student fee invoices retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceController(req, res, next) {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(req.tenantId, id);

    // Ownership check for Student
    if (
      req.roles.includes('STUDENT') &&
      !req.roles.includes('SCHOOL_ADMIN') &&
      !req.roles.includes('ACCOUNTANT') &&
      !req.roles.includes('OWNER') &&
      !req.user?.isSuperAdmin
    ) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!student || student.id !== invoice.studentId) {
        return sendError(res, 'Access denied. You can only view your own invoice.', 403);
      }
    }

    // Ownership check for Parent
    if (
      req.roles.includes('PARENT') &&
      !req.roles.includes('SCHOOL_ADMIN') &&
      !req.roles.includes('ACCOUNTANT') &&
      !req.roles.includes('OWNER') &&
      !req.user?.isSuperAdmin
    ) {
      const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: req.user.id } });
      if (!parentProfile) {
        return sendError(res, 'Parent profile not found.', 403);
      }
      const linked = await prisma.studentParent.findFirst({
        where: {
          tenantId: req.tenantId,
          parentProfileId: parentProfile.id,
          studentId: invoice.studentId,
        },
      });
      if (!linked) {
        return sendError(res, 'Access denied. You can only view invoices of your verified children.', 403);
      }
    }

    return sendSuccess(res, invoice, 'Invoice retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function recordPaymentController(req, res, next) {
  try {
    const validated = recordPaymentSchema.parse(req.body);
    const payment = await recordPayment(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, payment, 'Payment recorded successfully');
  } catch (error) {
    next(error);
  }
}

export async function getFinancialMetricsController(req, res, next) {
  try {
    const metrics = await getFinancialSummaryMetrics(req.tenantId);
    return sendSuccess(res, metrics, 'Financial summary metrics calculated');
  } catch (error) {
    next(error);
  }
}

export async function createDiscountRuleController(req, res, next) {
  try {
    const validated = createFeeDiscountRuleSchema.parse(req.body);
    const rule = await createFeeDiscountRule(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, rule, 'Fee discount rule created successfully');
  } catch (error) {
    next(error);
  }
}

export async function listDiscountRulesController(req, res, next) {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const rules = await listFeeDiscountRules(req.tenantId, activeOnly);
    return sendSuccess(res, rules, 'Fee discount rules retrieved');
  } catch (error) {
    next(error);
  }
}

export async function evaluateDiscountController(req, res, next) {
  try {
    const validated = evaluateDiscountSchema.parse(req.body);
    const evaluation = await evaluateStudentDiscounts(req.tenantId, validated);
    return sendSuccess(res, evaluation, 'Student fee discount eligibility evaluated');
  } catch (error) {
    next(error);
  }
}

export async function reversePaymentController(req, res, next) {
  try {
    const { id } = req.params;
    const validated = reversePaymentSchema.parse(req.body);
    const result = await reversePaymentWithVoucher(req.tenantId, id, validated, req.user?.id, req);
    return sendSuccess(res, result, 'Payment reversed and cancellation voucher issued successfully');
  } catch (error) {
    next(error);
  }
}

export async function getDayEndCashBookController(req, res, next) {
  try {
    const { date, cashierId } = req.query;
    const cashBook = await getDayEndCashBook(req.tenantId, { date, cashierId });
    return sendSuccess(res, cashBook, 'Day-end cash book calculated successfully');
  } catch (error) {
    next(error);
  }
}

export async function getDefaultersController(req, res, next) {
  try {
    const { courseId, daysPastDue } = req.query;
    const defaulters = await getFeeDefaultersList(req.tenantId, { courseId, daysPastDue });
    return sendSuccess(res, defaulters, 'Fee defaulters list retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createGatewayOrderController(req, res, next) {
  try {
    const validated = createGatewayOrderSchema.parse(req.body);
    const order = await createPaymentOrder(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, order, 'Payment gateway order created successfully');
  } catch (error) {
    next(error);
  }
}

export async function processGatewayWebhookController(req, res, next) {
  try {
    const validated = processWebhookSchema.parse(req.body);
    const result = await processGatewayPaymentSuccess(req.tenantId, validated, req.user?.id, req);
    return sendSuccess(res, result, 'Payment webhook processed successfully');
  } catch (error) {
    next(error);
  }
}
