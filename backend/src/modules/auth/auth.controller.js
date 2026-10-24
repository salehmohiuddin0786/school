import { loginUser, refreshUserSession, logoutUser, changeUserPassword } from './auth.service.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { config } from '../../config/index.js';

function setAuthCookies(res, accessToken, refreshToken) {
  const isSecure = config.COOKIE_SECURE;
  const cookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
  };

  if (config.COOKIE_DOMAIN) {
    cookieOptions.domain = config.COOKIE_DOMAIN;
  }

  // Access token cookie (15 minutes)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Refresh token cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: config.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  const cookieOptions = {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
  };
  if (config.COOKIE_DOMAIN) {
    cookieOptions.domain = config.COOKIE_DOMAIN;
  }
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
}

export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const result = await loginUser({
      email: validated.email,
      password: validated.password,
      ipAddress,
      userAgent,
    });

    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    return sendSuccess(
      res,
      {
        user: result.user,
        tokens: result.tokens,
      },
      'Logged in successfully'
    );
  } catch (error) {
    if (error.message.includes('Invalid email or password')) {
      return sendError(res, error.message, 401);
    }
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return sendError(res, 'No refresh token provided', 401);
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const result = await refreshUserSession({
      refreshToken: token,
      ipAddress,
      userAgent,
    });

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return sendSuccess(res, result, 'Session refreshed successfully');
  } catch (error) {
    clearAuthCookies(res);
    return sendError(res, error.message, 401);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = req.user?.id;

    await logoutUser({ refreshToken: token, userId });
    clearAuthCookies(res);

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res) {
  return sendSuccess(
    res,
    {
      user: req.user,
      roles: req.roles,
      permissions: req.permissions,
    },
    'Authenticated user profile retrieved'
  );
}

export async function changePassword(req, res, next) {
  try {
    const validated = changePasswordSchema.parse(req.body);
    await changeUserPassword({
      userId: req.user.id,
      currentPassword: validated.currentPassword,
      newPassword: validated.newPassword,
      req,
    });

    clearAuthCookies(res);

    return sendSuccess(
      res,
      null,
      'Password changed successfully. Please log in again with your new password.'
    );
  } catch (error) {
    if (error.message.includes('Incorrect current password')) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
}
