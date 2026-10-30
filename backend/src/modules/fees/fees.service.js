import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

export async function createFeeStructure(tenantId, data, userId = null, req = null) {
  let categoryId = data.categoryId;
  if (!categoryId) {
    let defaultCat = await prisma.feeCategory.findFirst({
      where: { tenantId, name: 'Tuition Fee' },
    });
    if (!defaultCat) {
      defaultCat = await prisma.feeCategory.create({
        data: {
          tenantId,
          name: 'Tuition Fee',
          code: 'TUITION',
          description: 'Standard academic tuition fee',
        },
      });
    }
    categoryId = defaultCat.id;
  }

  const structure = await prisma.feeStructure.create({
    data: {
      tenantId,
      feeCategoryId: categoryId,
      courseId: data.courseId || null,
      academicYearId: data.academicYearId,
      name: data.name,
      amount: data.amount,
      frequency: data.frequency,
      dueDate: new Date(data.dueDate),
    },
    include: {
      feeCategory: true,
      academicYear: { select: { name: true } },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE_FEE_STRUCTURE',
    entityType: 'FEE_STRUCTURE',
    entityId: structure.id,
    newValues: { name: structure.name, amount: structure.amount },
    req,
  });

  return structure;
}

export async function listFeeStructures(tenantId, academicYearId = null) {
  const where = { tenantId };
  if (academicYearId) where.academicYearId = academicYearId;

  return prisma.feeStructure.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    include: {
      feeCategory: true,
      academicYear: { select: { name: true } },
    },
  });
}

export async function createInvoice(tenantId, data, userId = null, req = null) {
  const student = await prisma.student.findFirst({
    where: { id: data.studentId, tenantId },
    include: { user: true },
  });
  if (!student) throw new Error('Student not found.');

  const count = await prisma.invoice.count({ where: { tenantId } });
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const subtotal = data.lines.reduce((acc, line) => acc + Number(line.amount), 0);
  const totalAmount = subtotal;

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      invoiceNumber,
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      dueDate: new Date(data.dueDate),
      subtotal,
      totalAmount,
      paidAmount: 0.0,
      status: 'ISSUED',
      lines: {
        create: data.lines.map((l) => ({
          tenantId,
          description: l.description,
          quantity: 1,
          unitPrice: l.amount,
          totalAmount: l.amount,
          studentFeeId: l.studentFeeId || null,
        })),
      },
    },
    include: {
      lines: true,
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE_INVOICE',
    entityType: 'INVOICE',
    entityId: invoice.id,
    newValues: { invoiceNumber, studentId: data.studentId, totalAmount },
    req,
  });

  return invoice;
}

export async function listStudentInvoices(tenantId, studentId) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
  });
  if (!student) throw new Error('Student not found in your institution.');

  return prisma.invoice.findMany({
    where: { tenantId, studentId },
    orderBy: { issueDate: 'desc' },
    include: {
      lines: true,
      payments: {
        where: { paymentStatus: 'SUCCESSFUL' },
        orderBy: { paymentDate: 'desc' },
      },
      academicYear: { select: { name: true } },
    },
  });
}

export async function getInvoiceById(tenantId, invoiceId) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: {
      lines: true,
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          campus: { select: { name: true, address: true, phone: true } },
        },
      },
      academicYear: { select: { name: true, code: true } },
      tenant: {
        select: {
          name: true,
          code: true,
          address: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          phone: true,
          email: true,
          website: true,
          currencyCode: true,
        },
      },
    },
  });

  if (!invoice) throw new Error('Invoice not found in your institution.');
  return invoice;
}

export async function recordPayment(tenantId, data, recordedById = null, req = null) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: data.invoiceId, tenantId },
    include: { payments: true },
  });
  if (!invoice) throw new Error('Invoice not found.');

  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  if (Number(data.amount) > remaining) {
    throw new Error(`Payment amount (${data.amount}) cannot exceed remaining invoice balance (${remaining}).`);
  }

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        tenantId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionReference: data.transactionReference,
        notes: data.notes || null,
        recordedById,
        paymentStatus: 'SUCCESSFUL',
      },
    });

    const newPaidAmount = Number(invoice.paidAmount) + Number(data.amount);
    const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return createdPayment;
  });

  await logAudit({
    tenantId,
    userId: recordedById,
    action: 'RECORD_PAYMENT',
    entityType: 'PAYMENT',
    entityId: payment.id,
    newValues: { invoiceId: data.invoiceId, amount: data.amount, reference: data.transactionReference },
    req,
  });

  return payment;
}

export async function getFinancialSummaryMetrics(tenantId) {
  const [invoices, payments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId },
      select: { totalAmount: true, paidAmount: true, status: true },
    }),
    prisma.payment.findMany({
      where: { tenantId, paymentStatus: 'SUCCESSFUL' },
      select: { amount: true, paymentDate: true },
    }),
    prisma.expense.findMany({
      where: { tenantId },
      select: { amount: true },
    }),
  ]);

  let totalBilled = 0;
  let totalCollected = 0;
  let totalPending = 0;

  for (const inv of invoices) {
    const billed = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    totalBilled += billed;
    totalCollected += paid;
    totalPending += billed - paid;
  }

  let totalExpenses = 0;
  for (const exp of expenses) {
    totalExpenses += Number(exp.amount);
  }

  return {
    totalBilled,
    totalCollected,
    totalPending,
    totalExpenses,
    netCashFlow: totalCollected - totalExpenses,
    invoiceCount: invoices.length,
    paymentCount: payments.length,
  };
}

// -------------------------------------------------------------
// FEE DISCOUNT & SCHOLARSHIP RULES
// -------------------------------------------------------------

export async function createFeeDiscountRule(tenantId, data, userId = null, req = null) {
  const existing = await prisma.feeDiscountRule.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: data.code,
      },
    },
  });

  if (existing) {
    const err = new Error(`Discount rule with code '${data.code}' already exists.`);
    err.statusCode = 409;
    throw err;
  }

  const rule = await prisma.feeDiscountRule.create({
    data: {
      tenantId,
      name: data.name,
      code: data.code,
      description: data.description || null,
      discountType: data.discountType || 'PERCENTAGE',
      value: data.value,
      applicableOn: data.applicableOn || 'TUITION_ONLY',
      isAutomatic: data.isAutomatic ?? false,
      criteria: data.criteria || null,
      isActive: data.isActive ?? true,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE_DISCOUNT_RULE',
    entityType: 'FEE_DISCOUNT_RULE',
    entityId: rule.id,
    newValues: { name: rule.name, code: rule.code, value: rule.value },
    req,
  });

  return rule;
}

export async function listFeeDiscountRules(tenantId, activeOnly = false) {
  const where = { tenantId };
  if (activeOnly) where.isActive = true;

  return prisma.feeDiscountRule.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Automatically evaluates eligible fee discounts (e.g. sibling order, staff ward).
 */
export async function evaluateStudentDiscounts(tenantId, { studentId, baseAmount, categoryName = 'Tuition Fee' }) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: {
      studentParents: {
        include: {
          parent: {
            include: {
              studentParents: {
                include: {
                  student: {
                    select: { id: true, admissionDate: true, admissionNumber: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    const err = new Error('Student not found.');
    err.statusCode = 404;
    throw err;
  }

  // 1. Calculate Sibling Hierarchy Order
  // Gather all unique student IDs sharing any parent profile
  const siblingMap = new Map();
  siblingMap.set(student.id, student.admissionDate);

  student.studentParents.forEach((sp) => {
    sp.parent.studentParents.forEach((otherSp) => {
      siblingMap.set(otherSp.student.id, otherSp.student.admissionDate);
    });
  });

  // Sort siblings by admissionDate ascending (first admitted = child 1)
  const sortedSiblings = Array.from(siblingMap.entries()).sort(
    (a, b) => new Date(a[1]) - new Date(b[1])
  );
  const siblingOrder = sortedSiblings.findIndex(([id]) => id === student.id) + 1;
  const totalSiblingsInSchool = sortedSiblings.length;

  // 2. Query Active Automatic Rules
  const activeRules = await prisma.feeDiscountRule.findMany({
    where: { tenantId, isActive: true },
  });

  let applicableDiscounts = [];
  let totalDiscountAmount = 0;
  const numBase = Number(baseAmount);

  for (const rule of activeRules) {
    let isEligible = false;
    let rationale = '';

    // Sibling rule evaluation
    if (rule.code.includes('SIBLING') && siblingOrder > 1) {
      isEligible = true;
      rationale = `Sibling concession eligible (Child #${siblingOrder} of ${totalSiblingsInSchool} enrolled siblings).`;
    }

    if (isEligible) {
      let discountVal = 0;
      if (rule.discountType === 'PERCENTAGE') {
        discountVal = (numBase * Number(rule.value)) / 100;
      } else {
        discountVal = Math.min(Number(rule.value), numBase);
      }

      applicableDiscounts.push({
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleName: rule.name,
        discountType: rule.discountType,
        ruleValue: Number(rule.value),
        discountAmount: Number(discountVal.toFixed(2)),
        rationale,
      });

      totalDiscountAmount += discountVal;
    }
  }

  const netPayable = Math.max(0, numBase - totalDiscountAmount);

  return {
    studentId,
    siblingOrder,
    totalSiblingsInSchool,
    baseAmount: numBase,
    totalDiscountAmount: Number(totalDiscountAmount.toFixed(2)),
    netPayable: Number(netPayable.toFixed(2)),
    applicableDiscounts,
  };
}

// -------------------------------------------------------------
// PAYMENT REVERSAL / CANCELLATION VOUCHER ENGINE
// -------------------------------------------------------------

/**
 * Reverses a previously collected payment with an immutable audit voucher.
 * Reverts invoice paid amount atomically.
 */
export async function reversePaymentWithVoucher(tenantId, paymentId, { reason, notes }, authorizedSupervisorId = null, req = null) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId },
    include: {
      invoice: true,
      reversal: true,
    },
  });

  if (!payment) {
    const err = new Error('Payment record not found.');
    err.statusCode = 404;
    throw err;
  }

  if (payment.reversal) {
    const err = new Error(`Payment is already reversed under voucher ${payment.reversal.reversalVoucherNo}.`);
    err.statusCode = 400;
    throw err;
  }

  if (payment.paymentStatus !== 'SUCCESSFUL') {
    const err = new Error(`Cannot reverse a payment with status '${payment.paymentStatus}'.`);
    err.statusCode = 400;
    throw err;
  }

  const reversalCount = await prisma.paymentReversal.count({ where: { tenantId } });
  const year = new Date().getFullYear();
  const reversalVoucherNo = `REV-${year}-${String(reversalCount + 1).padStart(5, '0')}`;

  const paymentAmount = Number(payment.amount);
  const invoice = payment.invoice;
  const updatedPaidAmount = Math.max(0, Number(invoice.paidAmount) - paymentAmount);
  const updatedInvoiceStatus = updatedPaidAmount <= 0 ? 'ISSUED' : 'PARTIALLY_PAID';

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Immutable Reversal Voucher
    const reversal = await tx.paymentReversal.create({
      data: {
        tenantId,
        paymentId: payment.id,
        reversalVoucherNo,
        reason,
        amount: payment.amount,
        status: 'APPROVED',
        requestedById: authorizedSupervisorId || 'SYSTEM_SUPERVISOR',
        approvedById: authorizedSupervisorId,
        notes: notes || null,
      },
    });

    // 2. Mark Payment as REFUNDED/REVERSED
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: 'REFUNDED',
        notes: payment.notes ? `${payment.notes} | Reversed via ${reversalVoucherNo}` : `Reversed via ${reversalVoucherNo}`,
      },
    });

    // 3. Rollback Invoice Paid Amount & Status
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: updatedPaidAmount,
        status: updatedInvoiceStatus,
      },
    });

    return reversal;
  });

  await logAudit({
    tenantId,
    userId: authorizedSupervisorId,
    action: 'REVERSE_PAYMENT',
    entityType: 'PAYMENT',
    entityId: payment.id,
    newValues: {
      reversalVoucherNo,
      amount: paymentAmount,
      invoiceId: invoice.id,
      restoredBalance: Number(invoice.totalAmount) - updatedPaidAmount,
    },
    req,
  });

  return {
    reversalVoucherNo: result.reversalVoucherNo,
    paymentId: payment.id,
    reversedAmount: paymentAmount,
    reason,
    invoiceId: invoice.id,
    previousPaidAmount: Number(invoice.paidAmount),
    currentPaidAmount: updatedPaidAmount,
    currentInvoiceStatus: updatedInvoiceStatus,
  };
}

// -------------------------------------------------------------
// DAY-END CASH BOOK & DEFAULTER REPORTS
// -------------------------------------------------------------

export async function getDayEndCashBook(tenantId, { date = null, cashierId = null } = {}) {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const wherePayment = {
    tenantId,
    paymentDate: {
      gte: startOfDay,
      lte: endOfDay,
    },
    paymentStatus: 'SUCCESSFUL',
  };

  if (cashierId) {
    wherePayment.recordedById = cashierId;
  }

  const [payments, reversals] = await Promise.all([
    prisma.payment.findMany({
      where: wherePayment,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            student: {
              select: {
                admissionNumber: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'asc' },
    }),
    prisma.paymentReversal.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),
  ]);

  const methodBreakdown = {
    CASH: { count: 0, total: 0 },
    UPI: { count: 0, total: 0 },
    CARD: { count: 0, total: 0 },
    BANK_TRANSFER: { count: 0, total: 0 },
    CHEQUE: { count: 0, total: 0 },
    ONLINE_GATEWAY: { count: 0, total: 0 },
  };

  let grossCollected = 0;

  payments.forEach((p) => {
    const amt = Number(p.amount);
    grossCollected += amt;

    const m = p.paymentMethod || 'CASH';
    if (!methodBreakdown[m]) {
      methodBreakdown[m] = { count: 0, total: 0 };
    }
    methodBreakdown[m].count += 1;
    methodBreakdown[m].total += amt;
  });

  let totalReversals = 0;
  reversals.forEach((r) => {
    totalReversals += Number(r.amount);
  });

  const netCollections = grossCollected - totalReversals;

  return {
    date: startOfDay.toISOString().split('T')[0],
    totalTransactions: payments.length,
    grossCollected: Number(grossCollected.toFixed(2)),
    totalReversals: Number(totalReversals.toFixed(2)),
    netCollections: Number(netCollections.toFixed(2)),
    cashInDrawer: Number((methodBreakdown.CASH?.total || 0).toFixed(2)),
    methodBreakdown,
    transactions: payments.map((p) => ({
      id: p.id,
      receiptNumber: p.transactionReference,
      amount: Number(p.amount),
      method: p.paymentMethod,
      time: p.paymentDate,
      invoiceNumber: p.invoice?.invoiceNumber,
      admissionNumber: p.invoice?.student?.admissionNumber,
      studentName: `${p.invoice?.student?.user?.firstName || ''} ${p.invoice?.student?.user?.lastName || ''}`.trim(),
    })),
  };
}

export async function getFeeDefaultersList(tenantId, { courseId = null, daysPastDue = 0 } = {}) {
  const cutoffDate = new Date();
  if (daysPastDue > 0) {
    cutoffDate.setDate(cutoffDate.getDate() - Number(daysPastDue));
  }

  const where = {
    tenantId,
    status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
    dueDate: { lte: cutoffDate },
  };

  if (courseId) {
    where.student = {
      enrollments: {
        some: {
          section: { courseId },
          status: 'ACTIVE',
        },
      },
    };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, phone: true, email: true } },
          enrollments: {
            where: { status: 'ACTIVE' },
            take: 1,
            include: {
              section: {
                include: { course: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return invoices.map((inv) => {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const overdueBalance = total - paid;
    const diffDays = Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));

    const activeEnrollment = inv.student?.enrollments?.[0];
    const className = activeEnrollment?.section?.course?.name || 'Unassigned';
    const sectionName = activeEnrollment?.section?.name || '';

    return {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      studentId: inv.studentId,
      admissionNumber: inv.student.admissionNumber,
      studentName: `${inv.student.user.firstName} ${inv.student.user.lastName}`.trim(),
      parentPhone: inv.student.user.phone || 'N/A',
      parentEmail: inv.student.user.email,
      classSection: `${className} - ${sectionName}`.trim(),
      dueDate: inv.dueDate.toISOString().split('T')[0],
      daysOverdue: Math.max(0, diffDays),
      totalBilled: total,
      totalPaid: paid,
      overdueBalance: Number(overdueBalance.toFixed(2)),
    };
  });
}
