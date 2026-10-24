# SchoolNext ERP

> Production-oriented, multi-tenant School and College ERP SaaS platform.

SchoolNext ERP is engineered to manage multiple independent institutions (schools, colleges, universities) on a unified platform with strict data isolation, configurable RBAC, academic scheduling, examination grading, fee management, and self-hosted deployment capabilities on Ubuntu Server.

---

## 1. Technology Stack

- **Frontend**: Next.js App Router (React 19, JavaScript & JSX only), Tailwind CSS, Lucide icons, React Hook Form, Zod, Recharts.
- **Backend**: Node.js LTS, Express, REST API (`/api/v1`), Prisma ORM, MySQL InnoDB, Zod request validation.
- **Security**: Argon2id/bcrypt password hashing, HTTP-only SameSite cookies, database-backed revocable sessions with session rotation, Helmet, CORS allowlisting, rate limiting, centralized error handling, audit logging.
- **Database**: MySQL 8.0+ / 9.0+ with 60 normalized multi-tenant models, compound unique keys, and Decimal currency types.

---

## 2. Directory Structure

```
school-nextjs/
├── backend/                  # Express REST API, Prisma schema, migrations, seeds, tests
│   ├── prisma/
│   │   ├── migrations/       # Versioned SQL migrations (source of truth)
│   │   └── schema.prisma     # 60 normalized models with InnoDB relations
│   ├── src/
│   │   ├── config/           # Environment validation (Zod)
│   │   ├── db/               # Prisma client singleton
│   │   ├── middleware/       # Auth, TenantScope, RBAC, RateLimiter, ErrorHandler
│   │   ├── modules/          # Feature modules (health, auth, tenants, users)
│   │   ├── seeds/            # Idempotent database seed script
│   │   ├── utils/            # JWT, Crypto, Logger, Audit, Response helpers
│   │   ├── app.js            # Express application configuration
│   │   └── server.js         # Server bootstrap and graceful shutdown
│   └── tests/                # Automated security, tenant-isolation, and auth tests
├── frontend/                 # Next.js App Router application (JS/JSX only)
│   ├── src/
│   │   ├── app/              # Next.js App Router pages (role dashboards, login, etc.)
│   │   ├── components/       # Reusable UI cards, tables, layouts, navigation
│   │   └── lib/              # Client API helper with cookie credentials
│   └── public/               # Static assets
├── docs/                     # Architecture, API reference, permissions, setup, deployment
│   ├── implementation-status.md
│   ├── architecture.md
│   ├── api-reference.md
│   ├── permissions.md
│   ├── setup.md
│   ├── security.md
│   └── deployment.md
├── scripts/                  # Development and maintenance automation
│   └── dev.js                # Concurrent dev runner
├── package.json              # Monorepo management scripts
└── README.md
```

---

## 3. Quick Start

### Step 1: Install Dependencies
```bash
npm --prefix backend install
npm --prefix frontend install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env` in `backend/` and `frontend/`:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Step 3: Run Database Migrations & Seed
```bash
# Apply Prisma migrations
npm run prisma:migrate

# Seed demo institution, roles, and test users (idempotent)
npm run prisma:seed
```

### Step 4: Run Automated Tests
```bash
npm test
```

### Step 5: Start Development Servers
```bash
# Starts Express API (:5000) and Next.js (:3000) concurrently
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 4. Default Development Credentials

| Portal / Role | Email | Password |
|---------------|-------|----------|
| Platform Super Admin | `superadmin@schoolnext.internal` | `SuperAdmin@SchoolNext2026!` |
| School Admin | `admin@greenwood.edu` | `Admin@Greenwood2026!` |
| Principal | `principal@greenwood.edu` | `Admin@Greenwood2026!` |
| Teacher | `teacher.sharma@greenwood.edu` | `Teacher@Greenwood2026!` |
| Student | `student.aarav@greenwood.edu` | `Student@Greenwood2026!` |
| Parent | `parent.patel@greenwood.edu` | `Parent@Greenwood2026!` |
| Accountant | `accountant@greenwood.edu` | `Accountant@Greenwood2026!` |

---

## 5. Documentation Directory

- [Architecture & System Design](docs/architecture.md)
- [REST API Reference](docs/api-reference.md)
- [RBAC & Permissions Registry](docs/permissions.md)
- [Local Development Setup](docs/setup.md)
- [Security Guidelines & Isolation](docs/security.md)
- [Self-Managed Ubuntu Deployment](docs/deployment.md)
- [Phase Implementation Status](docs/implementation-status.md)
