import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  logger.error(`[${req.method}] ${req.url} - Error:`, err.message || err);

  // 1. Zod Request Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, formattedErrors);
  }

  // 2. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (err.code === 'P2002') {
      const target = err.meta?.target || 'field';
      return sendError(
        res,
        `A record with this ${Array.isArray(target) ? target.join(', ') : target} already exists.`,
        409
      );
    }
    // P2025: Record to update/delete not found
    if (err.code === 'P2025') {
      return sendError(res, 'Requested record was not found.', 404);
    }
    // P2003: Foreign key constraint failure
    if (err.code === 'P2003') {
      return sendError(res, 'Referenced related record does not exist or cannot be modified.', 400);
    }
  }

  // 3. Known application business errors
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode);
  }

  // Common duplicate / validation messages from services
  if (
    err.message &&
    (err.message.includes('already exists') ||
      err.message.includes('already assigned') ||
      err.message.includes('already scheduled') ||
      err.message.includes('already published') ||
      err.message.includes('already been published') ||
      err.message.includes('exceeds') ||
      err.message.includes('cannot exceed') ||
      err.message.includes('is required') ||
      err.message.includes('cannot publish') ||
      err.message.includes('not found'))
  ) {
    const status = err.message.includes('not found') ? 404 : 400;
    return sendError(res, err.message, status);
  }

  // 4. Custom status codes
  const status = err.status || 500;
  const message = err.isPublic || status < 500 ? err.message : 'Internal server error';

  return sendError(res, message, status);
}

export function notFoundHandler(req, res) {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}
