import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../db/prisma.js';
import { sendError } from '../utils/response.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Try Cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2. Try Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. No session or token provided.', 401);
    }

    // 3. Verify Token
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return sendError(res, 'Session expired or invalid token. Please log in again.', 401);
    }

    // 4. Fetch User from Database with Roles & Permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            status: true,
            currencyCode: true,
            timezone: true,
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User account no longer exists.', 401);
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, 'Account is suspended or pending activation. Contact administrator.', 403);
    }

    // If user is tenant-scoped, check tenant status
    if (user.tenant && user.tenant.status === 'SUSPENDED') {
      return sendError(res, 'Institution account is currently suspended. Contact support.', 403);
    }

    // Flatten roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissionSet = new Set();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        if (rp.permission?.code) {
          permissionSet.add(rp.permission.code);
        }
      });
    });

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: user.tenantId,
      tenant: user.tenant,
    };
    req.roles = roles;
    req.permissions = Array.from(permissionSet);

    next();
  } catch (error) {
    return sendError(res, 'Authentication error: ' + error.message, 500);
  }
}
