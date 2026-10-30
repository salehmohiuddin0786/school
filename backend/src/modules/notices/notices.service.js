import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

export async function createNotice(tenantId, data, publishedById = null, req = null) {
  const notice = await prisma.notice.create({
    data: {
      tenantId,
      title: data.title,
      content: data.content,
      targetAudience: data.targetAudience,
      isUrgent: data.isUrgent || false,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      publishedById,
    },
  });

  await logAudit({
    tenantId,
    userId: publishedById,
    action: 'CREATE_NOTICE',
    entityType: 'NOTICE',
    entityId: notice.id,
    newValues: { title: notice.title, audience: notice.targetAudience, isUrgent: notice.isUrgent },
    req,
  });

  return notice;
}

export async function listNotices(tenantId, { audience = null, activeOnly = true } = {}) {
  const where = { tenantId };

  if (activeOnly) {
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } },
    ];
  }

  if (audience) {
    if (Array.isArray(audience)) {
      where.targetAudience = { in: audience };
    } else {
      where.targetAudience = { in: ['ALL', audience] };
    }
  }

  return prisma.notice.findMany({
    where,
    orderBy: [
      { isUrgent: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function getNoticeById(id, tenantId) {
  return prisma.notice.findFirst({
    where: { id, tenantId },
  });
}
