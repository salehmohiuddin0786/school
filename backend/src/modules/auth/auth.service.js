import { prisma } from '../../db/prisma.js';
import { comparePassword, hashPassword, generateRandomToken, hashToken } from '../../utils/crypto.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { logAudit } from '../../utils/audit.js';
import { config } from '../../config/index.js';

export async function loginUser({ email, password, ipAddress, userAgent }) {
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      tenant: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          status: true,
          currencyCode: true,
          timezone: true,
          logoUrl: true,
        },
      },
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
      studentProfile: {
        select: {
          id: true,
          admissionNumber: true,
          campusId: true,
        },
      },
      teacherProfile: {
        select: {
          id: true,
          employeeCode: true,
          designation: true,
        },
      },
      parentProfile: {
        select: {
          id: true,
        },
      },
      staffProfile: {
        select: {
          id: true,
          employeeCode: true,
          designation: true,
        },
      },
    },
  });

  // Generic authentication error to prevent account enumeration
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Account is inactive or suspended. Please contact administrator.');
  }

  if (user.tenant && user.tenant.status === 'SUSPENDED') {
    throw new Error('Institution account is suspended. Please contact support.');
  }

  // Generate tokens
  const rawRefreshToken = generateRandomToken(40);
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  // Store refresh session in database
  await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      tokenHash,
      ipAddress: ipAddress ? String(ipAddress).substring(0, 45) : null,
      userAgent: userAgent ? String(userAgent).substring(0, 255) : null,
      expiresAt,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Create JWT access token
  const accessToken = signAccessToken({
    userId: user.id,
    isSuperAdmin: user.isSuperAdmin,
    tenantId: user.tenantId,
  });

  // Format roles and permissions
  const roles = user.userRoles.map((ur) => ur.role.code);
  const permissionSet = new Set();
  user.userRoles.forEach((ur) => {
    ur.role.rolePermissions.forEach((rp) => {
      if (rp.permission?.code) {
        permissionSet.add(rp.permission.code);
      }
    });
  });

  // Record audit log
  await logAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'LOGIN',
    entityType: 'USER',
    entityId: user.id,
    newValues: { ipAddress, userAgent },
  });

  return {
    user: {
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
      roles,
      permissions: Array.from(permissionSet),
      studentProfile: user.studentProfile,
      teacherProfile: user.teacherProfile,
      parentProfile: user.parentProfile,
      staffProfile: user.staffProfile,
    },
    tokens: {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: config.JWT_ACCESS_EXPIRES_IN,
    },
  };
}

export async function refreshUserSession({ refreshToken, ipAddress, userAgent }) {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  const tokenHash = hashToken(refreshToken);

  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          tenant: true,
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
        },
      },
    },
  });

  if (!session) {
    throw new Error('Invalid or expired session');
  }

  if (session.revokedAt) {
    // Potential token reuse attack - revoke all user sessions as a security precaution
    await prisma.refreshSession.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new Error('Session has been revoked. Security alert triggered. Please log in again.');
  }

  if (new Date() > session.expiresAt) {
    throw new Error('Session has expired. Please log in again.');
  }

  if (session.user.status !== 'ACTIVE') {
    throw new Error('User account is no longer active.');
  }

  // Revoke old session (Rotation)
  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  // Issue new refresh session
  const newRawRefreshToken = generateRandomToken(40);
  const newTokenHash = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshSession.create({
    data: {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      tokenHash: newTokenHash,
      ipAddress: ipAddress ? String(ipAddress).substring(0, 45) : null,
      userAgent: userAgent ? String(userAgent).substring(0, 255) : null,
      expiresAt,
    },
  });

  const accessToken = signAccessToken({
    userId: session.user.id,
    isSuperAdmin: session.user.isSuperAdmin,
    tenantId: session.user.tenantId,
  });

  return {
    accessToken,
    refreshToken: newRawRefreshToken,
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  };
}

export async function logoutUser({ refreshToken, userId }) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } else if (userId) {
    // Revoke all active sessions for this user
    await prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export async function changeUserPassword({ userId, currentPassword, newPassword, req }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new Error('Incorrect current password.');
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Revoke all existing sessions so old logins cannot be used
  await prisma.refreshSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await logAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'CHANGE_PASSWORD',
    entityType: 'USER',
    entityId: user.id,
    req,
  });

  return true;
}
