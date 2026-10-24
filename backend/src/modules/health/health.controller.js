import { prisma } from '../../db/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getHealth(req, res) {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    return sendSuccess(
      res,
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'schoolnext-erp-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: 'connected',
          latencyMs: dbLatencyMs,
        },
        memoryUsage: process.memoryUsage(),
      },
      'Service is healthy'
    );
  } catch (error) {
    return sendError(
      res,
      'Health check failed: database unreachable',
      503,
      error.message
    );
  }
}

export async function getReadiness(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, { ready: true }, 'Application is ready to accept traffic');
  } catch (error) {
    return sendError(res, 'Application not ready', 503, error.message);
  }
}
