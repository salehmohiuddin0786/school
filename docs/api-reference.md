# SchoolNext ERP — REST API Reference (`/api/v1`)

All endpoints return standardized JSON payloads:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

---

## 1. System & Health

### `GET /api/v1/health`
Checks backend uptime, memory usage, and database ping latency.
- **Auth**: None (Public)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-10-24T16:04:29.549Z",
    "service": "schoolnext-erp-backend",
    "version": "1.0.0",
    "database": {
      "status": "connected",
      "latencyMs": 2
    }
  }
}
```

### `GET /api/v1/health/ready`
Readiness probe for load balancers.
- **Auth**: None (Public)
- **Response**: `200 OK`

---

## 2. Authentication

### `POST /api/v1/auth/login`
Authenticates a user and sets HTTP-only session cookies.
- **Auth**: None (Rate limited: 20 attempts / 15m)
- **Body**:
```json
{
  "email": "user@schoolnext.internal",
  "password": "Password123!"
}
```
- **Response**: `200 OK` with user profile, roles, permissions, and tokens. Sets `accessToken` and `refreshToken` cookies.

### `POST /api/v1/auth/refresh`
Rotates the current refresh session and issues fresh tokens.
- **Auth**: `refreshToken` cookie or body property.
- **Response**: `200 OK` with refreshed tokens.

### `POST /api/v1/auth/logout`
Revokes the current session and clears cookies.
- **Auth**: Bearer token or session cookie.
- **Response**: `200 OK`

### `GET /api/v1/auth/me`
Fetches the currently authenticated user's profile, tenant info, roles, and permissions.
- **Auth**: Required.
- **Response**: `200 OK`

### `POST /api/v1/auth/change-password`
Updates the authenticated user's password and revokes all active sessions.
- **Auth**: Required.
- **Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword@2026!"
}
```

---

## 3. Institutions & Tenants

### `GET /api/v1/tenants/current`
Returns the active institution profile for the logged-in user.
- **Auth**: Required (Tenant user).

### `GET /api/v1/tenants`
Lists all tenants across the platform with pagination and filtering.
- **Auth**: Required (`SUPER_ADMIN` only).
- **Query Params**: `page`, `limit`, `status`, `search`.

### `POST /api/v1/tenants`
Provisions a new institution tenant with default campus, academic year, and administrator user.
- **Auth**: Required (`SUPER_ADMIN` only).
- **Body**:
```json
{
  "code": "DPSN",
  "name": "Delhi Public School North",
  "type": "SCHOOL",
  "city": "New Delhi",
  "adminEmail": "admin@dpsnorth.edu",
  "adminFirstName": "Sunil",
  "adminLastName": "Verma",
  "adminPassword": "Admin@DPSNorth2026!"
}
```

### `GET /api/v1/tenants/:id`
Retrieves full institution profile by ID.
- **Auth**: `SUPER_ADMIN` or user belonging to `:id`.

### `PUT /api/v1/tenants/:id`
Updates tenant institution settings and branding.
- **Auth**: `SUPER_ADMIN` or `SCHOOL_ADMIN`/`PRINCIPAL` of that tenant.

### `PATCH /api/v1/tenants/:id/status`
Suspends or activates an institution tenant.
- **Auth**: `SUPER_ADMIN` only.

---

## 4. Campuses (`/api/v1/campuses`)

- `GET /api/v1/campuses`: Lists all campuses in the authenticated tenant. (Query: `search`, `isActive`).
- `GET /api/v1/campuses/:id`: Retrieves full campus details with department and room counts.
- `POST /api/v1/campuses`: Creates a new campus within the institution. Required roles: `SCHOOL_ADMIN`, `PRINCIPAL`.
- `PUT /api/v1/campuses/:id`: Updates campus name, address, contact, or main status.

---

## 5. Academics (`/api/v1/academics`)

- `GET /api/v1/academics/academic-years`: Lists all academic years.
- `GET /api/v1/academics/academic-years/current`: Returns the currently active academic year.
- `POST /api/v1/academics/academic-years`: Creates a new academic year.
- `PATCH /api/v1/academics/academic-years/:id/set-current`: Atomically marks year as current and unsets previous current year.
- `GET /api/v1/academics/departments`: Lists departments (optional `campusId` filter).
- `POST /api/v1/academics/departments`: Creates a new department.
- `GET /api/v1/academics/courses`: Lists class courses (optional `departmentId` filter).
- `POST /api/v1/academics/courses`: Creates a class course (e.g. `CLS-10`, `CLS-11`).
- `GET /api/v1/academics/sections`: Lists class sections with enrollment counts (filters: `courseId`, `academicYearId`).
- `GET /api/v1/academics/sections/:id`: Returns section roster, class subjects, and teacher assignments.
- `POST /api/v1/academics/sections`: Creates a section under a course and academic year.
- `GET /api/v1/academics/subjects`: Lists curriculum subjects.
- `POST /api/v1/academics/subjects`: Creates a subject with credit hours and elective flag.
- `POST /api/v1/academics/class-subjects`: Maps a subject to a section curriculum.

---

## 6. Students & Admissions (`/api/v1/students`)

- `GET /api/v1/students`: Paginated directory search. Required permission: `students.read`. (Query: `search`, `sectionId`, `courseId`, `campusId`, `gender`, `page`, `limit`).
- `GET /api/v1/students/:id`: Detailed student profile with enrollment history, parents, and metrics.
  - *Student role*: Can access own record only.
  - *Parent role*: Can access verified linked children only.
  - *Staff*: Requires `students.read`.
- `POST /api/v1/students/admit`: Complete admission workflow executed atomically. Creates User, Student profile, assigns `STUDENT` role, creates Section `Enrollment`, and optionally links/creates parent. Required permission: `students.create`.
- `PUT /api/v1/students/:id`: Updates student details. Required permission: `students.update`.
- `POST /api/v1/students/:id/enroll`: Enrolls student into another class section. Required permission: `students.update`.

---

## 7. Parents (`/api/v1/parents`)

- `GET /api/v1/parents/my-children`: Authenticated parent retrieves their verified linked children. Required role: `PARENT`.
- `GET /api/v1/parents`: Directory of registered parents with search and pagination. Required permission: `students.read`.
- `GET /api/v1/parents/:id`: Parent profile with linked children.
- `POST /api/v1/parents`: Registers a parent user and profile. Required permission: `students.create`.
- `POST /api/v1/parents/:id/link-student`: Links parent to student with verified relationship (`FATHER`, `MOTHER`, `GUARDIAN`). Required permission: `students.create`.

---

## 8. Teachers (`/api/v1/teachers`)

- `GET /api/v1/teachers/my-profile`: Authenticated faculty retrieves their personal profile, assigned subjects, and weekly timetable. Required role: `TEACHER`.
- `GET /api/v1/teachers`: Faculty directory.
- `GET /api/v1/teachers/:id`: Detailed teacher profile with class assignments and schedule.
- `POST /api/v1/teachers`: Registers faculty user, assigns `TEACHER` role, and creates `TeacherProfile` with employee code. Required roles: `SCHOOL_ADMIN`, `PRINCIPAL`.
- `PUT /api/v1/teachers/:id`: Updates teacher qualifications and designations.

---

## 9. Timetable & Scheduling (`/api/v1/timetable`)

- `POST /api/v1/timetable/assignments`: Assigns a teacher to a class subject for an academic year. Required roles: `SCHOOL_ADMIN`, `PRINCIPAL`.
- `POST /api/v1/timetable/entries`: Schedules a class slot with automated 3-way conflict detection (teacher, section, classroom overlap). Returns `409 Conflict` if occupied. Required roles: `SCHOOL_ADMIN`, `PRINCIPAL`.
- `GET /api/v1/timetable/section/:sectionId`: Retrieves weekly schedule for a class section.
- `GET /api/v1/timetable/teacher/:teacherProfileId`: Retrieves weekly schedule for a teacher.
- `GET /api/v1/timetable/my-schedule`: Authenticated student retrieves their active class timetable. Required role: `STUDENT`.
- `DELETE /api/v1/timetable/entries/:id`: Removes a scheduled class slot. Required roles: `SCHOOL_ADMIN`, `PRINCIPAL`.

---

## 10. Attendance & Leaves (`/api/v1/attendance`)

- `POST /api/v1/attendance/record`: Records bulk daily attendance for a class section. Required permission: `attendance.mark`.
  - Body: `{ sectionId, date: "YYYY-MM-DD", records: [{ studentId, status: "PRESENT"|"ABSENT"|"LATE"|"HALF_DAY"|"EXCUSED", remarks }] }`.
- `GET /api/v1/attendance/section/:sectionId`: Retrieves section attendance for a specific date (default: today). Required permission: `attendance.read`.
- `GET /api/v1/attendance/section/:sectionId/stats`: Computes daily section metrics: total enrolled, present count, absent count, and attendance percentage.
- `PUT /api/v1/attendance/:id`: Corrects an individual attendance record with required reason and records compliance entry in `AuditLog`. Required permission: `attendance.approve`.
- `GET /api/v1/attendance/student/:studentId/summary`: Calculates student total days, days present, absent, late, percentage, and deficiency status (`SATISFACTORY` vs `ATTENDANCE_DEFICIENT`).
  - *Student role*: Allowed for own record only.
  - *Parent role*: Allowed for verified linked children only.
  - *Staff*: Requires `attendance.read`.
- `POST /api/v1/attendance/leaves/apply`: Faculty/staff applies for leave (`CASUAL`, `SICK`, `EARNED`, `MATERNITY`, `UNPAID`).
- `PATCH /api/v1/attendance/leaves/:id/review`: Principal/Admin approves or rejects leave and decrements `StaffLeaveBalance`. Required roles: `SCHOOL_ADMIN`, `PRINCIPAL`.
- `GET /api/v1/attendance/leaves`: Lists leave requests with status filter. Required roles: `SCHOOL_ADMIN`, `PRINCIPAL`, `HR_MANAGER`.

---

## 11. User Management

### `GET /api/v1/users`
Lists users inside the active tenant with pagination and role filtering.
- **Auth**: Required (`users.manage` permission).
- **Query Params**: `page`, `limit`, `role`, `status`, `search`.

### `GET /api/v1/users/:id`
Retrieves detailed user profile and assigned roles.
- **Auth**: Required (`users.manage` permission).

### `POST /api/v1/users`
Creates a new user and assigns roles within the active tenant.
- **Auth**: Required (`users.manage` permission).
- **Body**:
```json
{
  "email": "teacher.roy@greenwood.edu",
  "password": "Password@2026!",
  "firstName": "Priya",
  "lastName": "Roy",
  "phone": "+919876543219",
  "roles": ["TEACHER"]
}
```

### `PUT /api/v1/users/:id`
Updates user profile information and assigned roles.
- **Auth**: Required (`users.manage` permission).

### `PATCH /api/v1/users/:id/status`
Updates user active/suspended state.
- **Auth**: Required (`users.manage` permission).

---

## 12. Examinations & Grading (`/api/v1/exams`)

- `POST /api/v1/exams`: Schedules an institution examination across terms. Required permission: `exams.manage`.
  - Body: `{ academicYearId, name, examType, startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }`.
- `GET /api/v1/exams`: Lists all examinations with subject and report card counts. Filterable by `academicYearId`. Required permission: `exams.read`.
- `GET /api/v1/exams/:id`: Retrieves full examination details including scheduled papers and mark entry progress.
- `POST /api/v1/exams/:examId/subjects`: Schedules subject examination papers with maxMarks, passMarks, and session timings. Required permission: `exams.manage`.
- `POST /api/v1/exams/subjects/:examSubjectId/marks`: Bulk records subject marks for students. Validates marks <= maxMarks. Required permission: `marks.enter`.
- `GET /api/v1/exams/subjects/:examSubjectId/marks`: Retrieves subject marks sheet with student performance. Required permission: `exams.read`.
- `POST /api/v1/exams/:examId/publish`: Calculates final totals, percentages, letter grades, GPA, and class ranks, and publishes report cards atomically. Locks marks against future changes. Required permission: `results.publish`.
- `GET /api/v1/exams/:examId/report-cards/:studentId`: Retrieves official student report card.
  - *Student role*: Allowed for own record only.
  - *Parent role*: Allowed for verified linked children only.
  - *Staff*: Requires `exams.read`.
- `POST /api/v1/exams/grade-scales`: Configures grading scale boundaries (e.g. A+: 90-100%, 10.0 GPA). Required permission: `exams.manage`.
- `GET /api/v1/exams/grade-scales`: Lists institution grade scales. Required permission: `exams.read`.

---

## 13. Assignments & LMS (`/api/v1/assignments`)

- `POST /api/v1/assignments`: Creates homework or project assignment linked to a class subject with due dates and optional attachment URLs. Required permission: `assignments.manage`.
- `GET /api/v1/assignments`: Lists assignments with filters (`classSubjectId`, `teacherProfileId`). Automatically attaches submission status for logged-in students.
- `GET /api/v1/assignments/:id`: Retrieves assignment details with teacher and submission metrics.
- `POST /api/v1/assignments/:id/submit`: Student submits digital assignment with submission text and/or file link.
- `GET /api/v1/assignments/:id/submissions`: Teacher/Admin views all student submissions for an assignment. Required permission: `assignments.manage`.
- `PATCH /api/v1/assignments/submissions/:submissionId/grade`: Evaluates and grades student submission with feedback. Enforces marks <= maxMarks. Required permission: `assignments.manage`.
- `POST /api/v1/assignments/materials`: Publishes syllabus notes, reference documents, or lecture links. Required permission: `assignments.manage`.
- `GET /api/v1/assignments/materials`: Lists published study resources filtered by `classSubjectId`.

