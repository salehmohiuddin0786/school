import { sendError } from '../utils/response.js';

export function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.isSuperAdmin) {
    return sendError(res, 'Access denied. Platform Super Admin privileges required.', 403);
  }
  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const hasRole = req.roles?.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return sendError(
        res,
        `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
}

export function requirePermission(...allowedPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const hasPerm = req.permissions?.some((p) => allowedPermissions.includes(p));
    if (!hasPerm) {
      return sendError(
        res,
        `Permission denied. Requires one of: ${allowedPermissions.join(', ')}`,
        403
      );
    }

    next();
  };
}
