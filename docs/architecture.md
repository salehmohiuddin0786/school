# SchoolNext ERP — Architecture & System Design

## 1. High-Level Architecture Overview

SchoolNext ERP is architected as a production-grade, multi-tenant SaaS application designed for schools, colleges, and educational groups.

```
+-------------------------------------------------------------+
|                      Clients (Web Browsers)                 |
+-------------------------------------------------------------+
                               |
                               | HTTPS / SameSite Cookies / API calls
                               v
+-------------------------------------------------------------+
|                      Reverse Proxy (Nginx)                  |
|    - SSL Termination                                        |
|    - Security Headers                                       |
|    - Static Asset Caching                                   |
+-------------------------------------------------------------+
        |                                             |
        | / (Frontend routes)                         | /api/v1/* (REST API)
        v                                             v
+-----------------------------+             +-------------------------------+
|     Next.js App Router      |             |     Node.js Express Backend   |
|   (JavaScript / JSX UI)     |             |         (Port 5000)           |
|                             |             | - Helmet & CORS Allowlist     |
| - Role-based Dashboards     |             | - Rate Limiter                |
| - Server & Client Comps     |             | - JWT & Revocable Sessions    |
| - Tailwind CSS & Lucide     |             | - Tenant Scope Middleware     |
| - Recharts & React Hook Form|             | - Granular Role/Perm Auth     |
+-----------------------------+             | - Centralized Error Handler   |
                                            +-------------------------------+
                                                           |
                                                           | Prisma ORM
                                                           v
                                            +-------------------------------+
                                            |   MySQL 8.0+ / 9.0 Database   |
                                            | - InnoDB Engine               |
                                            | - UTF8MB4 Collation           |
                                            | - Compound Unique Constraints |
                                            | - Decimal Currency Precision  |
                                            | - 60 Normalized Models        |
                                            +-------------------------------+
```

---

## 2. Multi-Tenant Isolation Strategy

Tenant isolation is enforced strictly at the backend middleware and query layer:

1. **Authentication Token Payload**:
   The signed access token includes `{ userId, tenantId, isSuperAdmin }`.
2. **Tenant Context Middleware (`tenantScope.js`)**:
   - Resolves `req.tenantId` strictly from the verified session.
   - For tenant users, if the client supplies a different `x-tenant-id` header or body `tenantId`, the request is immediately rejected with `403 Forbidden` ("Cross-tenant access violation").
   - For Platform Super Admins, `x-tenant-id` may be specified to inspect a particular institution, but it is verified against the database.
3. **Database Query Isolation**:
   Every query executed on behalf of a tenant user includes `where: { tenantId: req.tenantId, ... }` to ensure zero possibility of data leakage across institutions (IDOR/BOLA prevention).

---

## 3. Authentication & Session Management

- **Access Tokens**: Short-lived (15 minutes) signed JSON Web Tokens stored in HTTP-only `SameSite=lax` cookies or passed via `Authorization: Bearer <token>`.
- **Refresh Sessions**: Stored in the `RefreshSession` table with SHA-256 hashed token lookup, expiration date (7 days default), IP address, and user-agent.
- **Session Rotation**: Every call to `/api/v1/auth/refresh` revokes the previous session and generates a new refresh token and session.
- **Token Reuse Detection**: If a revoked refresh token is re-submitted, all active sessions for that user are immediately revoked, and the request is blocked.
- **Password Security**: Passwords are saved using `bcryptjs` with 12 salt rounds. Plaintext passwords are never stored or logged.

---

## 4. Database Engine & Model Groups

The database uses **MySQL InnoDB** to ensure ACID compliance, foreign key integrity, and row-level locking. All monetary values utilize `Decimal(12, 2)` or `Decimal(14, 2)` to eliminate floating-point rounding errors.

The schema spans 8 distinct domain groups:
1. **Identity & SaaS**: `Tenant`, `SubscriptionPlan`, `Subscription`, `FeatureEntitlement`, `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `RefreshSession`, `AuditLog`.
2. **Institution & Academics**: `Campus`, `AcademicYear`, `Department`, `ClassRoom`, `Course`, `Semester`, `Section`, `Subject`, `ClassSubject`, `TeacherAssignment`, `TimetableEntry`, `Enrollment`.
3. **Students & Staff**: `Student`, `ParentProfile`, `StudentParent`, `TeacherProfile`, `StaffProfile`, `StaffAttendance`, `StaffLeaveBalance`, `LeaveRequest`.
4. **Attendance & Examinations**: `StudentAttendance`, `Exam`, `ExamSubject`, `Assessment`, `MarkEntry`, `GradeScale`, `ReportCard`.
5. **Learning**: `Assignment`, `AssignmentSubmission`, `LearningMaterial`.
6. **Finance**: `FeeCategory`, `FeeStructure`, `StudentFee`, `Invoice`, `InvoiceLine`, `Payment`, `Refund`, `Expense`.
7. **Operations**: `Notice`, `Notification`, `LibraryBook`, `BookIssue`, `TransportRoute`, `Vehicle`, `HostelRoom`, `InventoryItem`.
8. **HR & Payroll**: `PayrollPeriod`, `PayrollRecord`.
