import { prisma } from '../../db/prisma.js';

export async function getOwnerExecutiveOverview(tenantId) {
  const [tenant, totalStudents, totalTeachers, invoices, payments, expenses, recentPayments] =
    await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          city: true,
          state: true,
          currencyCode: true,
        },
      }),
      prisma.student.count({ where: { tenantId, user: { status: 'ACTIVE' } } }),
      prisma.teacherProfile.count({ where: { tenantId } }),
      prisma.invoice.findMany({
        where: { tenantId },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.payment.findMany({
        where: { tenantId, paymentStatus: 'SUCCESSFUL' },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        where: { tenantId },
        select: { amount: true },
      }),
      prisma.payment.findMany({
        where: { tenantId, paymentStatus: 'SUCCESSFUL' },
        take: 8,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
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
    institution: tenant,
    metrics: {
      totalStudents,
      totalTeachers,
      totalBilled,
      totalCollected,
      totalPending,
      totalExpenses,
      netCashFlow: totalCollected - totalExpenses,
    },
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      reference: p.transactionReference,
      date: p.paymentDate,
      studentName: p.invoice?.student?.user
        ? `${p.invoice.student.user.firstName} ${p.invoice.student.user.lastName}`
        : 'Student',
      invoiceNumber: p.invoice?.invoiceNumber,
    })),
  };
}

export async function getOwnerStudents(tenantId, { search = '', page = 1, limit = 20 } = {}) {
  const where = { tenantId, user: { status: 'ACTIVE' } };
  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ],
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        campus: { select: { name: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            section: {
              include: {
                course: { select: { name: true, code: true } },
              },
            },
          },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total, page: Number(page), limit: Number(limit) };
}

export async function getOwnerTeachers(tenantId, { search = '', page = 1, limit = 20 } = {}) {
  const where = { tenantId };
  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ],
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [teachers, total] = await Promise.all([
    prisma.teacherProfile.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        campus: { select: { name: true } },
        _count: {
          select: { timetableEntries: true, assignments: true },
        },
      },
    }),
    prisma.teacherProfile.count({ where }),
  ]);

  return { teachers, total, page: Number(page), limit: Number(limit) };
}
