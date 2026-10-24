import {
  listUsers,
  getUserById,
  createUserWithRoles,
  updateUserDetails,
  updateUserStatus,
} from './user.service.js';
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from './user.schema.js';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '../../utils/response.js';

export async function getAllUsers(req, res, next) {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    // For non-super admin, always filter by user's tenantId
    const tenantId = req.user.isSuperAdmin ? req.tenantId : req.user.tenantId;

    const { users, total } = await listUsers({
      tenantId,
      search,
      role,
      status,
      page,
      limit,
    });

    return sendPaginated(res, users, total, page, limit, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const tenantId = req.user.isSuperAdmin ? req.tenantId : req.user.tenantId;

    const user = await getUserById(id, tenantId);
    if (!user) {
      return sendError(res, 'User not found or does not belong to your institution', 404);
    }

    return sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const validated = createUserSchema.parse(req.body);
    const tenantId = req.user.isSuperAdmin ? (req.tenantId || req.body.tenantId) : req.user.tenantId;

    if (!tenantId) {
      return sendError(res, 'Tenant ID is required to create a user', 400);
    }

    const newUser = await createUserWithRoles(validated, tenantId, req.user.id, req);
    return sendCreated(res, newUser, 'User created successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const tenantId = req.user.isSuperAdmin ? req.tenantId : req.user.tenantId;

    const validated = updateUserSchema.parse(req.body);
    const updated = await updateUserDetails(id, tenantId, validated, req.user.id, req);

    return sendSuccess(res, updated, 'User updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function setUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const tenantId = req.user.isSuperAdmin ? req.tenantId : req.user.tenantId;

    const validated = updateUserStatusSchema.parse(req.body);
    const updated = await updateUserStatus(id, tenantId, validated.status, req.user.id, req);

    return sendSuccess(res, updated, `User status updated to ${validated.status}`);
  } catch (error) {
    next(error);
  }
}
