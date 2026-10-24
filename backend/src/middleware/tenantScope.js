import { sendError } from '../utils/response.js';
import { prisma } from '../db/prisma.js';

/**
 * Middleware ensuring strict tenant isolation.
 * Resolves active tenant from authenticated session.
 * Prevents IDOR/BOLA attacks where a user passes a foreign tenantId.
 */
export async function tenantScope(req, res, next) {
  if (!req.user) {
    return sendError(res, 'Authentication required before tenant resolution.', 401);
  }

  // 1. Platform Super Admin logic
  if (req.user.isSuperAdmin) {
    const targetTenantId =
      req.headers['x-tenant-id'] || req.query.tenantId || req.params.tenantId;

    if (targetTenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: targetTenantId },
      });
      if (!tenant) {
        return sendError(res, 'Target tenant institution does not exist.', 404);
      }
      req.tenantId = tenant.id;
      req.targetTenant = tenant;
    } else {
      req.tenantId = null; // Operating at platform super-admin level
    }

    req.tenantFilter = req.tenantId ? { tenantId: req.tenantId } : {};
    return next();
  }

  // 2. Tenant-scoped users (School Admin, Principal, Teacher, Student, Parent, etc.)
  if (!req.user.tenantId) {
    return sendError(res, 'User is not associated with any active institution tenant.', 403);
  }

  const userTenantId = req.user.tenantId;

  // Verify that any explicitly supplied tenant ID matches the authenticated session's tenant
  const suppliedTenantId =
    req.headers['x-tenant-id'] || req.query.tenantId || req.body?.tenantId;

  if (suppliedTenantId && suppliedTenantId !== userTenantId) {
    return sendError(
      res,
      'Cross-tenant access violation: You are not authorized to access or modify records of another institution.',
      403
    );
  }

  req.tenantId = userTenantId;
  req.tenantFilter = { tenantId: userTenantId };

  next();
}

/**
 * Middleware strictly requiring that a tenant context is active (non-null).
 */
export function requireTenant(req, res, next) {
  if (!req.tenantId) {
    return sendError(
      res,
      'Institution tenant context is required for this operation. Platform Super Admins must specify x-tenant-id.',
      400
    );
  }
  next();
}
