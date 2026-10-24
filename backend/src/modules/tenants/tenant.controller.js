import {
  listTenants,
  getTenantById,
  createTenantWithAdmin,
  updateTenantDetails,
  updateTenantStatus,
} from './tenant.service.js';
import {
  createTenantSchema,
  updateTenantSchema,
  updateTenantStatusSchema,
} from './tenant.schema.js';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '../../utils/response.js';

export async function getAllTenants(req, res, next) {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const { tenants, total } = await listTenants({ search, status, page, limit });
    return sendPaginated(res, tenants, total, page, limit, 'Tenants retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getCurrentTenant(req, res, next) {
  try {
    if (!req.tenantId) {
      return sendError(res, 'No tenant context associated with this session', 400);
    }
    const tenant = await getTenantById(req.tenantId);
    if (!tenant) {
      return sendError(res, 'Tenant not found', 404);
    }
    return sendSuccess(res, tenant, 'Current tenant retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getTenant(req, res, next) {
  try {
    const { id } = req.params;

    // Enforce tenant authorization: non-super admin can only access their own tenant
    if (!req.user.isSuperAdmin && req.user.tenantId !== id) {
      return sendError(res, 'Access denied. You can only view your own institution.', 403);
    }

    const tenant = await getTenantById(id);
    if (!tenant) {
      return sendError(res, 'Tenant not found', 404);
    }
    return sendSuccess(res, tenant, 'Tenant retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createTenant(req, res, next) {
  try {
    const validated = createTenantSchema.parse(req.body);
    const result = await createTenantWithAdmin(validated, req.user.id, req);
    return sendCreated(res, result, 'Tenant created successfully with administrative account');
  } catch (error) {
    next(error);
  }
}

export async function updateTenant(req, res, next) {
  try {
    const { id } = req.params;

    // Non-super admin can only update their own tenant
    if (!req.user.isSuperAdmin && req.user.tenantId !== id) {
      return sendError(res, 'Access denied to update another institution.', 403);
    }

    const validated = updateTenantSchema.parse(req.body);
    const updated = await updateTenantDetails(id, validated, req.user.id, req);
    return sendSuccess(res, updated, 'Tenant details updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function setTenantStatus(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateTenantStatusSchema.parse(req.body);
    const updated = await updateTenantStatus(id, validated, req.user.id, req);
    return sendSuccess(res, updated, `Tenant status updated to ${validated.status}`);
  } catch (error) {
    next(error);
  }
}
