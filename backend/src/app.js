import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Import route modules
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import tenantRoutes from './modules/tenants/tenant.routes.js';
import userRoutes from './modules/users/user.routes.js';
import campusRoutes from './modules/campuses/campus.routes.js';
import academicRoutes from './modules/academics/academics.routes.js';
import studentRoutes from './modules/students/student.routes.js';
import parentRoutes from './modules/parents/parent.routes.js';
import teacherRoutes from './modules/teachers/teacher.routes.js';
import timetableRoutes from './modules/timetable/timetable.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';

export function createApp() {
  const app = express();

  // Trust proxy for secure cookie and rate limiting on reverse proxy (Nginx / Ubuntu)
  app.set('trust proxy', 1);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Next.js frontend flexibility
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  const allowedOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-requested-with'],
    })
  );

  // Body Parsing & Cookies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(config.COOKIE_SECRET));

  // Global rate limiter
  app.use(apiRateLimiter);

  // Root welcome / ping
  app.get('/', (req, res) => {
    res.json({
      service: 'SchoolNext ERP API Gateway',
      version: '1.0.0',
      apiDocs: '/api/v1/health',
      status: 'online',
    });
  });

  // API v1 Routing
  const apiV1 = express.Router();
  apiV1.use('/health', healthRoutes);
  apiV1.use('/auth', authRoutes);
  apiV1.use('/tenants', tenantRoutes);
  apiV1.use('/users', userRoutes);
  apiV1.use('/campuses', campusRoutes);
  apiV1.use('/academics', academicRoutes);
  apiV1.use('/students', studentRoutes);
  apiV1.use('/parents', parentRoutes);
  apiV1.use('/teachers', teacherRoutes);
  apiV1.use('/timetable', timetableRoutes);
  apiV1.use('/attendance', attendanceRoutes);

  app.use('/api/v1', apiV1);

  // 404 & Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
