import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const configSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().default(7),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 chars'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3005'),
  COOKIE_DOMAIN: z.string().optional().default(''),
  COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),

  // Seed configuration
  SEED_SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@schoolnext.internal'),
  SEED_SUPER_ADMIN_PASSWORD: z.string().default('SuperAdmin@SchoolNext2026!'),
  SEED_TENANT_ADMIN_PASSWORD: z.string().default('Admin@Greenwood2026!'),
  SEED_TEACHER_PASSWORD: z.string().default('Teacher@Greenwood2026!'),
  SEED_STUDENT_PASSWORD: z.string().default('Student@Greenwood2026!'),
  SEED_PARENT_PASSWORD: z.string().default('Parent@Greenwood2026!'),
  SEED_ACCOUNTANT_PASSWORD: z.string().default('Accountant@Greenwood2026!'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export default config;
