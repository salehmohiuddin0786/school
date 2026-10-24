# SchoolNext ERP — Local Development Setup Guide

## Prerequisites

- **Node.js**: LTS version (v20.x or v22.x or v24.x)
- **Database**: MySQL 8.0+ or 9.0+ (or MariaDB 10.6+)
- **Storage Engine**: InnoDB
- **Package Manager**: `npm` (v10+)

---

## 1. Database Configuration

Ensure MySQL is running on localhost. Connect to MySQL as root and create the database:

```sql
CREATE DATABASE schoolnext_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 2. Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://root:@localhost:3306/schoolnext_erp"
JWT_ACCESS_SECRET="super_secret_access_jwt_key_schoolnext_2026_dev"
JWT_REFRESH_SECRET="super_secret_refresh_jwt_key_schoolnext_2026_dev"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN_DAYS=7
COOKIE_SECRET="schoolnext_cookie_secret_key_2026"
CORS_ORIGIN="http://localhost:3000,http://localhost:3005"
COOKIE_DOMAIN=""
COOKIE_SECURE="false"

SEED_SUPER_ADMIN_EMAIL="superadmin@schoolnext.internal"
SEED_SUPER_ADMIN_PASSWORD="SuperAdmin@SchoolNext2026!"
SEED_TENANT_ADMIN_PASSWORD="Admin@Greenwood2026!"
SEED_TEACHER_PASSWORD="Teacher@Greenwood2026!"
SEED_STUDENT_PASSWORD="Student@Greenwood2026!"
SEED_PARENT_PASSWORD="Parent@Greenwood2026!"
SEED_ACCOUNTANT_PASSWORD="Accountant@Greenwood2026!"
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME="SchoolNext ERP"
```

---

## 3. Installation & Database Setup

From the project root:

```bash
# 1. Install dependencies
npm --prefix backend install
npm --prefix frontend install

# 2. Generate Prisma Client
npm run prisma:generate

# 3. Apply database migrations
npm run prisma:migrate

# 4. Seed development database (idempotent)
npm run prisma:seed

# 5. Run automated test suite
npm test
```

---

## 4. Running the Development Environment

Start both backend (Express on port 5000) and frontend (Next.js on port 3000) concurrently:

```bash
npm run dev
```

Or run them individually in separate terminals:
```bash
npm run dev:backend
npm run dev:frontend
```

---

## 5. Development Credentials

| Portal | Email | Password |
|--------|-------|----------|
| Platform Super Admin | `superadmin@schoolnext.internal` | `SuperAdmin@SchoolNext2026!` |
| School Admin | `admin@greenwood.edu` | `Admin@Greenwood2026!` |
| Principal | `principal@greenwood.edu` | `Admin@Greenwood2026!` |
| Teacher | `teacher.sharma@greenwood.edu` | `Teacher@Greenwood2026!` |
| Student | `student.aarav@greenwood.edu` | `Student@Greenwood2026!` |
| Parent | `parent.patel@greenwood.edu` | `Parent@Greenwood2026!` |
| Accountant | `accountant@greenwood.edu` | `Accountant@Greenwood2026!` |
