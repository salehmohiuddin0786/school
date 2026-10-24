# SchoolNext ERP — Security Architecture & Guidelines

## 1. Authentication Security

- **Password Hashing**: Utilizes `bcryptjs` with 12 salt rounds. Plaintext passwords are never stored in the database or written to logs.
- **Short-Lived Access Tokens**: Signed with `JWT_ACCESS_SECRET` with an expiry of 15 minutes.
- **Revocable Database-Backed Refresh Sessions**: Refresh tokens are stored only as SHA-256 hashes in the `RefreshSession` table.
- **Session Rotation & Replay Protection**:
  When a refresh token is exchanged, the existing session is permanently revoked and a new refresh session is generated. If a revoked session token is submitted, the system flags a possible token replay attack and revokes all active sessions for that user.
- **HTTP-Only Cookies**: Tokens are transported using `HttpOnly`, `SameSite=lax` cookies to protect against cross-site scripting (XSS) credential theft. In production, `Secure=true` is enforced.
- **Brute Force Defense**: `/api/v1/auth/login` is strictly rate limited to 20 attempts per 15-minute window per IP.
- **Account Enumeration Prevention**: Authentication failures return identical generic errors (`Invalid email or password.`) regardless of whether the email exists.

---

## 2. Multi-Tenant Authorization & IDOR/BOLA Protection

- **Tenant Isolation**: Non-super admin users can only operate on records associated with `req.user.tenantId`.
- **Untrusted Client Headers**: The server never trusts client-supplied tenant identifiers. Attempting to supply a different `x-tenant-id` header or body `tenantId` triggers an immediate `403 Forbidden` response.
- **Query Scoping**: Every database query on tenant-scoped models includes explicit `tenantId: req.tenantId` filters.
- **Role Verification**: Middleware validates that the user possesses the required role and permissions before invoking controllers.

---

## 3. Financial Integrity & Data Precision

- **Decimal Types**: All monetary values use MySQL `DECIMAL(12, 2)` or `DECIMAL(14, 2)` types rather than floating-point values to eliminate rounding drift.
- **Transactions**: Multi-record state transitions (such as tenant creation, user role allocations, and fee payments) are executed inside atomic `prisma.$transaction` blocks.
- **Payment Reconciliation**: Online payments require verified server-side cryptographic webhooks with idempotency keys. No payment is marked successful merely from browser redirect parameters.

---

## 4. Audit Logging

Sensitive actions—including authentication events, password updates, tenant modifications, status updates, fee collections, and role changes—are recorded in the `AuditLog` table with:
- `tenantId` & `userId`
- `action` (e.g. `LOGIN`, `CREATE`, `UPDATE_STATUS`, `CHANGE_PASSWORD`)
- `entityType` and `entityId`
- Sanitized `oldValues` and `newValues` JSON snapshots
- Client `ipAddress` and `userAgent`
