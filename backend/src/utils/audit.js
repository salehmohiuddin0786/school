import { prisma } from '../db/prisma.js';
import { logger } from './logger.js';

export async function logAudit({
  tenantId = null,
  userId = null,
  action,
  entityType,
  entityId = null,
  oldValues = null,
  newValues = null,
  req = null,
}) {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : undefined,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : undefined,
        ipAddress: ipAddress ? String(ipAddress).substring(0, 45) : null,
        userAgent: userAgent ? String(userAgent).substring(0, 255) : null,
      },
    });
  } catch (error) {
    logger.warn('Failed to record audit log:', error.message);
  }
}
