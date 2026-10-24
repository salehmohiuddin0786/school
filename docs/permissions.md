# SchoolNext ERP — Role-Based Access Control (RBAC) & Permissions

## 1. System Roles

SchoolNext ERP provides 10 pre-configured standard roles with configurable permission assignments:

| Role Code | Role Name | Scope | Description |
|-----------|-----------|-------|-------------|
| `SUPER_ADMIN` | Platform Super Admin | Platform-wide | Manages tenants, plans, trials, billing, and platform-wide configurations. |
| `SCHOOL_ADMIN` | School Administrator | Institution | Full operational and administrative access within their institution tenant. |
| `PRINCIPAL` | Principal / Academic Head | Institution | Oversees teachers, students, exam schedules, attendance approvals, and report publication. |
| `TEACHER` | Teacher / Faculty | Section / Subject | Manages assigned class attendance, marks entry, syllabus, and assignments. |
| `STUDENT` | Student | Personal | Views own timetable, attendance records, report cards, fee dues, and assignments. |
| `PARENT` | Parent / Guardian | Linked Children | Views linked children's attendance, academic progress, notices, and pays fee invoices. |
| `ACCOUNTANT` | Accountant / Fee Manager | Institution | Collects fees, generates invoices, tracks expenses, and generates financial summaries. |
| `HR_MANAGER` | HR & Staff Manager | Institution | Manages staff attendance, leaves, employee profiles, and payroll disbursements. |
| `LIBRARIAN` | Librarian | Campus | Manages book catalog, issue/return transactions, and overdue fine collection. |
| `TRANSPORT_STAFF` | Transport & Hostel Staff | Campus | Manages bus routes, vehicles, driver records, and hostel room bed allocations. |

---

## 2. Granular Permissions Registry

| Permission Code | Module | Description | Typical Roles |
|-----------------|--------|-------------|---------------|
| `students.read` | STUDENTS | View student directory and profiles | School Admin, Principal, Teacher, Accountant |
| `students.create` | STUDENTS | Register and admit new students | School Admin |
| `students.update` | STUDENTS | Update student profile data | School Admin |
| `students.delete` | STUDENTS | Archive or remove student records | School Admin |
| `attendance.read` | ATTENDANCE | View attendance reports and summaries | School Admin, Principal, Teacher, Student, Parent |
| `attendance.mark` | ATTENDANCE | Record daily student attendance | Teacher, School Admin |
| `attendance.approve`| ATTENDANCE | Authorize attendance adjustments | Principal, School Admin |
| `academics.manage` | ACADEMICS | Configure courses, classes, sections, and subjects | School Admin, Principal |
| `timetable.manage` | ACADEMICS | Schedule timetable entries and room allocations | School Admin, Principal |
| `exams.read` | EXAMS | View exam dates and schedules | All authenticated roles |
| `exams.manage` | EXAMS | Create exams, subjects, and grading scales | School Admin, Principal |
| `marks.enter` | EXAMS | Input marks for assigned examinations | Teacher, School Admin |
| `results.publish` | EXAMS | Approve and publish official report cards | Principal, School Admin |
| `fees.read` | FEES | View fee balances and payment history | School Admin, Accountant, Student, Parent |
| `fees.collect` | FEES | Record offline and online fee receipts | Accountant, School Admin |
| `fees.manage` | FEES | Create fee structures, categories, and discounts | Accountant, School Admin |
| `expenses.manage` | FINANCE | Track institutional operational expenses | Accountant, School Admin |
| `assignments.manage`| LEARNING | Post assignments and grade student submissions | Teacher, School Admin |
| `users.manage` | ADMIN | Add, update, and deactivate tenant users | School Admin |
| `settings.manage` | ADMIN | Update institution settings and branding | School Admin |
| `reports.export` | ADMIN | Export CSV/PDF reports across modules | School Admin, Principal, Accountant |
| `audit.read` | ADMIN | Inspect system compliance audit logs | School Admin, Principal |
