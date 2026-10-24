import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPwd(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function seedDatabase() {
  console.log('🌱 Starting idempotent database seed for SchoolNext ERP...');

  // -------------------------------------------------------------
  // 1. SYSTEM PERMISSIONS
  // -------------------------------------------------------------
  console.log('1. Seeding system permissions...');
  const permissionsData = [
    // Students
    { code: 'students.read', module: 'STUDENTS', name: 'View Students', description: 'Can view student directories and profiles' },
    { code: 'students.create', module: 'STUDENTS', name: 'Admit Students', description: 'Can register and admit new students' },
    { code: 'students.update', module: 'STUDENTS', name: 'Update Students', description: 'Can update student information' },
    { code: 'students.delete', module: 'STUDENTS', name: 'Archive Students', description: 'Can archive or delete student records' },

    // Attendance
    { code: 'attendance.read', module: 'ATTENDANCE', name: 'View Attendance', description: 'Can view daily and monthly attendance' },
    { code: 'attendance.mark', module: 'ATTENDANCE', name: 'Mark Attendance', description: 'Can record and submit student attendance' },
    { code: 'attendance.approve', module: 'ATTENDANCE', name: 'Approve Attendance', description: 'Can correct and authorize attendance adjustments' },

    // Academics
    { code: 'academics.manage', module: 'ACADEMICS', name: 'Manage Academics', description: 'Can configure classes, courses, and subjects' },
    { code: 'timetable.manage', module: 'ACADEMICS', name: 'Manage Timetable', description: 'Can configure schedules and class allocations' },

    // Exams & Marks
    { code: 'exams.read', module: 'EXAMS', name: 'View Exams', description: 'Can view exam schedules and assessments' },
    { code: 'exams.manage', module: 'EXAMS', name: 'Manage Exams', description: 'Can schedule exams and configure grading scales' },
    { code: 'marks.enter', module: 'EXAMS', name: 'Enter Marks', description: 'Can input assessment marks for assigned classes' },
    { code: 'results.publish', module: 'EXAMS', name: 'Publish Results', description: 'Can approve and publish student report cards' },

    // Fees & Finance
    { code: 'fees.read', module: 'FEES', name: 'View Fees', description: 'Can view fee structures, balances, and receipts' },
    { code: 'fees.collect', module: 'FEES', name: 'Collect Fees', description: 'Can record student fee payments and issue receipts' },
    { code: 'fees.manage', module: 'FEES', name: 'Manage Fee Structure', description: 'Can configure fee categories and discount rules' },
    { code: 'expenses.manage', module: 'FINANCE', name: 'Manage Expenses', description: 'Can record and approve operational expenses' },

    // Learning
    { code: 'assignments.manage', module: 'LEARNING', name: 'Manage Assignments', description: 'Can create and grade assignments' },

    // Administration
    { code: 'users.manage', module: 'ADMIN', name: 'Manage Users', description: 'Can create and manage institution users and role assignments' },
    { code: 'settings.manage', module: 'ADMIN', name: 'Manage Settings', description: 'Can modify institution configurations and branding' },
    { code: 'reports.export', module: 'ADMIN', name: 'Export Reports', description: 'Can export operational, academic, and financial reports' },
    { code: 'audit.read', module: 'ADMIN', name: 'View Audit Logs', description: 'Can inspect security and compliance audit logs' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description, module: perm.module },
      create: perm,
    });
  }

  // -------------------------------------------------------------
  // 2. SUBSCRIPTION PLANS
  // -------------------------------------------------------------
  console.log('2. Seeding subscription plans...');
  const plansData = [
    {
      code: 'PLAN_STARTER',
      name: 'Starter School',
      tier: 'STARTER',
      description: 'Ideal for small schools and budding institutions up to 500 students.',
      price: 2499.0,
      currencyCode: 'INR',
      billingCycle: 'MONTHLY',
      maxStudents: 500,
      maxStaff: 50,
      maxCampuses: 1,
      features: { attendance: true, fees: true, exams: true, lms: false, transport: false },
    },
    {
      code: 'PLAN_GROWTH',
      name: 'Growth Campus',
      tier: 'GROWTH',
      description: 'Designed for established schools and colleges up to 2,000 students.',
      price: 6999.0,
      currencyCode: 'INR',
      billingCycle: 'MONTHLY',
      maxStudents: 2000,
      maxStaff: 150,
      maxCampuses: 2,
      features: { attendance: true, fees: true, exams: true, lms: true, transport: true, library: true },
    },
    {
      code: 'PLAN_ENTERPRISE',
      name: 'Enterprise Multi-Campus',
      tier: 'ENTERPRISE',
      description: 'For university networks and multi-campus institutions with unlimited capacity.',
      price: 14999.0,
      currencyCode: 'INR',
      billingCycle: 'MONTHLY',
      maxStudents: 10000,
      maxStaff: 1000,
      maxCampuses: 10,
      features: { attendance: true, fees: true, exams: true, lms: true, transport: true, library: true, hostel: true, hr: true },
    },
  ];

  const createdPlans = {};
  for (const plan of plansData) {
    createdPlans[plan.code] = await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  // -------------------------------------------------------------
  // 3. PLATFORM SUPER ADMIN ACCOUNT
  // -------------------------------------------------------------
  console.log('3. Seeding platform Super Admin...');
  const superAdminEmail = (process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@schoolnext.internal').toLowerCase().trim();
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || 'SuperAdmin@SchoolNext2026!';
  const superAdminHash = await hashPwd(superAdminPassword);

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: superAdminHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
    create: {
      email: superAdminEmail,
      passwordHash: superAdminHash,
      firstName: 'Platform',
      lastName: 'Super Admin',
      phone: '+919876543210',
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });

  // Global SUPER_ADMIN role
  let superAdminRole = await prisma.role.findFirst({
    where: { tenantId: null, code: 'SUPER_ADMIN' },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        tenantId: null,
        code: 'SUPER_ADMIN',
        name: 'Platform Super Admin',
        description: 'Unrestricted SaaS platform administration',
        isSystem: true,
      },
    });
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      tenantId: null,
    },
  });

  // -------------------------------------------------------------
  // 4. DEMO INSTITUTION TENANT: GREENWOOD INTERNATIONAL SCHOOL
  // -------------------------------------------------------------
  console.log('4. Seeding demo institution (Greenwood International School)...');
  const demoTenant = await prisma.tenant.upsert({
    where: { code: 'GWIS' },
    update: {
      name: 'Greenwood International School',
      type: 'SCHOOL',
      status: 'ACTIVE',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    },
    create: {
      code: 'GWIS',
      name: 'Greenwood International School',
      type: 'SCHOOL',
      status: 'ACTIVE',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      address: '42, Varthur Main Road, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560066',
      phone: '+91 80 2845 1234',
      email: 'info@greenwood.edu',
      website: 'https://greenwood.schoolnext.internal',
    },
  });

  // Attach subscription
  const growthPlan = createdPlans['PLAN_GROWTH'];
  const existingSub = await prisma.subscription.findFirst({
    where: { tenantId: demoTenant.id },
  });
  if (!existingSub) {
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 365);

    await prisma.subscription.create({
      data: {
        tenantId: demoTenant.id,
        planId: growthPlan.id,
        status: 'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  // -------------------------------------------------------------
  // 5. TENANT SYSTEM ROLES & PERMISSION ASSIGNMENTS
  // -------------------------------------------------------------
  console.log('5. Seeding tenant roles and permissions...');
  const tenantRolesDefinition = [
    {
      code: 'SCHOOL_ADMIN',
      name: 'School Administrator',
      description: 'Full administrative access for the institution',
      permissions: [
        'students.read', 'students.create', 'students.update', 'students.delete',
        'attendance.read', 'attendance.mark', 'attendance.approve',
        'academics.manage', 'timetable.manage',
        'exams.read', 'exams.manage', 'marks.enter', 'results.publish',
        'fees.read', 'fees.collect', 'fees.manage', 'expenses.manage',
        'assignments.manage',
        'users.manage', 'settings.manage', 'reports.export', 'audit.read',
      ],
    },
    {
      code: 'PRINCIPAL',
      name: 'Principal / Academic Head',
      description: 'Academic oversight, attendance approvals, and report publication',
      permissions: [
        'students.read', 'attendance.read', 'attendance.approve',
        'academics.manage', 'timetable.manage',
        'exams.read', 'exams.manage', 'marks.enter', 'results.publish',
        'fees.read', 'reports.export', 'audit.read',
      ],
    },
    {
      code: 'TEACHER',
      name: 'Teacher / Faculty',
      description: 'Class attendance, syllabus, assignments, and marks entry for assigned classes',
      permissions: [
        'students.read', 'attendance.read', 'attendance.mark',
        'exams.read', 'marks.enter', 'assignments.manage',
      ],
    },
    {
      code: 'STUDENT',
      name: 'Student',
      description: 'Access personal timetable, attendance, marks, assignments, and fee status',
      permissions: [
        'attendance.read', 'exams.read', 'fees.read',
      ],
    },
    {
      code: 'PARENT',
      name: 'Parent / Guardian',
      description: 'Access linked children details, attendance, fee payment, and academic progress',
      permissions: [
        'attendance.read', 'exams.read', 'fees.read',
      ],
    },
    {
      code: 'ACCOUNTANT',
      name: 'Accountant / Fee Manager',
      description: 'Fee collection, invoice management, expenses, and financial reporting',
      permissions: [
        'students.read', 'fees.read', 'fees.collect', 'fees.manage', 'expenses.manage', 'reports.export',
      ],
    },
  ];

  const seededTenantRoles = {};
  for (const r of tenantRolesDefinition) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId: demoTenant.id, code: r.code } },
      update: { name: r.name, description: r.description },
      create: {
        tenantId: demoTenant.id,
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: true,
      },
    });
    seededTenantRoles[r.code] = role;

    // Attach role permissions
    for (const permCode of r.permissions) {
      const perm = await prisma.permission.findUnique({ where: { code: permCode } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 6. ACADEMIC STRUCTURE (CAMPUS, ACADEMIC YEAR, DEPARTMENTS, CLASSES, SUBJECTS)
  // -------------------------------------------------------------
  console.log('6. Seeding academic structure...');
  const campus = await prisma.campus.upsert({
    where: { tenantId_code: { tenantId: demoTenant.id, code: 'MAIN' } },
    update: { name: 'Greenwood Whitefield Campus', isMain: true },
    create: {
      tenantId: demoTenant.id,
      code: 'MAIN',
      name: 'Greenwood Whitefield Campus',
      address: '42, Varthur Main Road, Whitefield',
      phone: '+91 80 2845 1234',
      email: 'campus.main@greenwood.edu',
      isMain: true,
      isActive: true,
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { tenantId_code: { tenantId: demoTenant.id, code: '2025-2026' } },
    update: { isCurrent: true },
    create: {
      tenantId: demoTenant.id,
      code: '2025-2026',
      name: 'Academic Year 2025-26',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-05-31'),
      isCurrent: true,
    },
  });

  const department = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: demoTenant.id, code: 'SEC' } },
    update: { name: 'Secondary Wing (Grades 9-10)' },
    create: {
      tenantId: demoTenant.id,
      campusId: campus.id,
      code: 'SEC',
      name: 'Secondary Wing (Grades 9-10)',
      description: 'Secondary education wing preparing students for board exams',
    },
  });

  const room101 = await prisma.classRoom.upsert({
    where: { tenantId_campusId_roomNumber: { tenantId: demoTenant.id, campusId: campus.id, roomNumber: '101' } },
    update: { capacity: 40 },
    create: {
      tenantId: demoTenant.id,
      campusId: campus.id,
      roomNumber: '101',
      building: 'Aryabhata Block',
      capacity: 40,
    },
  });

  // Course: Class 10
  const class10 = await prisma.course.upsert({
    where: { tenantId_code: { tenantId: demoTenant.id, code: 'CLS-10' } },
    update: { name: 'Class 10' },
    create: {
      tenantId: demoTenant.id,
      departmentId: department.id,
      code: 'CLS-10',
      name: 'Class 10',
      description: 'Grade 10 Secondary Education Curriculum',
      durationYears: 1,
    },
  });

  // Section A
  let sectionA = await prisma.section.findFirst({
    where: {
      tenantId: demoTenant.id,
      academicYearId: academicYear.id,
      courseId: class10.id,
      name: 'Section A',
    },
  });
  if (!sectionA) {
    sectionA = await prisma.section.create({
      data: {
        tenantId: demoTenant.id,
        courseId: class10.id,
        academicYearId: academicYear.id,
        name: 'Section A',
        capacity: 40,
      },
    });
  }

  // Subjects
  const subjectsData = [
    { code: 'MATH-10', name: 'Mathematics', creditHours: 5.0 },
    { code: 'SCI-10', name: 'General Science', creditHours: 5.0 },
    { code: 'ENG-10', name: 'English Literature', creditHours: 4.0 },
    { code: 'COMP-10', name: 'Computer Applications', creditHours: 3.0 },
  ];

  const subjects = {};
  for (const sub of subjectsData) {
    subjects[sub.code] = await prisma.subject.upsert({
      where: { tenantId_code: { tenantId: demoTenant.id, code: sub.code } },
      update: { name: sub.name, creditHours: sub.creditHours },
      create: {
        tenantId: demoTenant.id,
        departmentId: department.id,
        code: sub.code,
        name: sub.name,
        creditHours: sub.creditHours,
      },
    });
  }

  // Link Section A to Subjects (ClassSubject)
  const classSubjects = {};
  for (const [code, sub] of Object.entries(subjects)) {
    let cs = await prisma.classSubject.findFirst({
      where: {
        tenantId: demoTenant.id,
        sectionId: sectionA.id,
        subjectId: sub.id,
      },
    });
    if (!cs) {
      cs = await prisma.classSubject.create({
        data: {
          tenantId: demoTenant.id,
          sectionId: sectionA.id,
          subjectId: sub.id,
        },
      });
    }
    classSubjects[code] = cs;
  }

  // -------------------------------------------------------------
  // 7. SEED USERS ACROSS ROLES
  // -------------------------------------------------------------
  console.log('7. Seeding demo users with roles...');
  const tenantAdminPassword = process.env.SEED_TENANT_ADMIN_PASSWORD || 'Admin@Greenwood2026!';
  const teacherPassword = process.env.SEED_TEACHER_PASSWORD || 'Teacher@Greenwood2026!';
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'Student@Greenwood2026!';
  const parentPassword = process.env.SEED_PARENT_PASSWORD || 'Parent@Greenwood2026!';
  const accountantPassword = process.env.SEED_ACCOUNTANT_PASSWORD || 'Accountant@Greenwood2026!';

  // Helper to upsert a user with role
  async function upsertTenantUser({ email, password, firstName, lastName, roleCode, phone }) {
    const pwdHash = await hashPwd(password);
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        passwordHash: pwdHash,
        firstName,
        lastName,
        phone,
        status: 'ACTIVE',
      },
      create: {
        tenantId: demoTenant.id,
        email: email.toLowerCase().trim(),
        passwordHash: pwdHash,
        firstName,
        lastName,
        phone,
        status: 'ACTIVE',
      },
    });

    const role = seededTenantRoles[roleCode];
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
          tenantId: demoTenant.id,
        },
      });
    }

    return user;
  }

  // 1) School Admin
  const schoolAdminUser = await upsertTenantUser({
    email: 'admin@greenwood.edu',
    password: tenantAdminPassword,
    firstName: 'Rajesh',
    lastName: 'Menon',
    roleCode: 'SCHOOL_ADMIN',
    phone: '+919876500001',
  });

  // 2) Principal
  const principalUser = await upsertTenantUser({
    email: 'principal@greenwood.edu',
    password: tenantAdminPassword,
    firstName: 'Dr. Anita',
    lastName: 'Deshmukh',
    roleCode: 'PRINCIPAL',
    phone: '+919876500002',
  });

  // 3) Teacher: Ramesh Sharma
  const teacherUser = await upsertTenantUser({
    email: 'teacher.sharma@greenwood.edu',
    password: teacherPassword,
    firstName: 'Ramesh',
    lastName: 'Sharma',
    roleCode: 'TEACHER',
    phone: '+919876500003',
  });

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: { employeeCode: 'EMP-T-101', designation: 'Senior Mathematics Faculty' },
    create: {
      tenantId: demoTenant.id,
      campusId: campus.id,
      userId: teacherUser.id,
      employeeCode: 'EMP-T-101',
      designation: 'Senior Mathematics Faculty',
      qualification: 'M.Sc. Mathematics, B.Ed.',
      specialization: 'Algebra & Geometry',
    },
  });

  // Assign Teacher Sharma to Math-10 in Section A
  const mathClassSubject = classSubjects['MATH-10'];
  if (mathClassSubject) {
    let assignment = await prisma.teacherAssignment.findFirst({
      where: {
        tenantId: demoTenant.id,
        teacherProfileId: teacherProfile.id,
        classSubjectId: mathClassSubject.id,
        academicYearId: academicYear.id,
      },
    });
    if (!assignment) {
      assignment = await prisma.teacherAssignment.create({
        data: {
          tenantId: demoTenant.id,
          teacherProfileId: teacherProfile.id,
          classSubjectId: mathClassSubject.id,
          academicYearId: academicYear.id,
        },
      });
    }

    // Add Timetable Entry (Monday 09:00 - 09:45)
    const existingTimetable = await prisma.timetableEntry.findFirst({
      where: {
        tenantId: demoTenant.id,
        sectionId: sectionA.id,
        subjectId: subjects['MATH-10'].id,
        dayOfWeek: 1,
        startTime: '09:00',
      },
    });
    if (!existingTimetable) {
      await prisma.timetableEntry.create({
        data: {
          tenantId: demoTenant.id,
          sectionId: sectionA.id,
          subjectId: subjects['MATH-10'].id,
          teacherProfileId: teacherProfile.id,
          classRoomId: room101.id,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '09:45',
        },
      });
    }
  }

  // 4) Student: Aarav Patel
  const studentUser = await upsertTenantUser({
    email: 'student.aarav@greenwood.edu',
    password: studentPassword,
    firstName: 'Aarav',
    lastName: 'Patel',
    roleCode: 'STUDENT',
    phone: '+919876500004',
  });

  const studentProfile = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: { admissionNumber: 'ADM-2025-001' },
    create: {
      tenantId: demoTenant.id,
      campusId: campus.id,
      userId: studentUser.id,
      admissionNumber: 'ADM-2025-001',
      admissionDate: new Date('2025-06-05'),
      dateOfBirth: new Date('2010-04-15'),
      gender: 'MALE',
      bloodGroup: 'O+',
      emergencyContact: '+91 98765 00005',
      address: '74, Palm Meadows, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560066',
    },
  });

  // Enroll Student in Section A
  let enrollment = await prisma.enrollment.findFirst({
    where: {
      tenantId: demoTenant.id,
      studentId: studentProfile.id,
      academicYearId: academicYear.id,
    },
  });
  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        tenantId: demoTenant.id,
        studentId: studentProfile.id,
        sectionId: sectionA.id,
        academicYearId: academicYear.id,
        rollNumber: '101',
        status: 'ACTIVE',
      },
    });
  }

  // 5) Parent: Vikram Patel (Father)
  const parentUser = await upsertTenantUser({
    email: 'parent.patel@greenwood.edu',
    password: parentPassword,
    firstName: 'Vikram',
    lastName: 'Patel',
    roleCode: 'PARENT',
    phone: '+919876500005',
  });

  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: { occupation: 'Software Engineering Director' },
    create: {
      tenantId: demoTenant.id,
      userId: parentUser.id,
      occupation: 'Software Engineering Director',
      alternatePhone: '+91 98765 00006',
      address: '74, Palm Meadows, Whitefield, Bengaluru',
    },
  });

  // Link Parent to Student
  let studentParent = await prisma.studentParent.findFirst({
    where: {
      tenantId: demoTenant.id,
      studentId: studentProfile.id,
      parentProfileId: parentProfile.id,
    },
  });
  if (!studentParent) {
    studentParent = await prisma.studentParent.create({
      data: {
        tenantId: demoTenant.id,
        studentId: studentProfile.id,
        parentProfileId: parentProfile.id,
        relationship: 'FATHER',
        isPrimaryContact: true,
        canPickup: true,
      },
    });
  }

  // 6) Accountant: Suresh Nair
  const accountantUser = await upsertTenantUser({
    email: 'accountant@greenwood.edu',
    password: accountantPassword,
    firstName: 'Suresh',
    lastName: 'Nair',
    roleCode: 'ACCOUNTANT',
    phone: '+919876500007',
  });

  // -------------------------------------------------------------
  // 8. SAMPLE FINANCE RECORDS (FEE CATEGORY, STRUCTURE, INVOICE)
  // -------------------------------------------------------------
  console.log('8. Seeding sample finance records...');
  const tuitionFeeCat = await prisma.feeCategory.upsert({
    where: { tenantId_name: { tenantId: demoTenant.id, name: 'Term Tuition Fee' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: 'Term Tuition Fee',
      description: 'Regular academic tuition fee charged termly',
      isRefundable: false,
    },
  });

  let feeStructure = await prisma.feeStructure.findFirst({
    where: {
      tenantId: demoTenant.id,
      academicYearId: academicYear.id,
      categoryId: tuitionFeeCat.id,
      courseId: class10.id,
    },
  });
  if (!feeStructure) {
    feeStructure = await prisma.feeStructure.create({
      data: {
        tenantId: demoTenant.id,
        academicYearId: academicYear.id,
        categoryId: tuitionFeeCat.id,
        courseId: class10.id,
        amount: 35000.0,
        frequency: 'TERMLY',
      },
    });
  }

  // Student Fee for Aarav
  let studentFee = await prisma.studentFee.findFirst({
    where: {
      tenantId: demoTenant.id,
      studentId: studentProfile.id,
      feeStructureId: feeStructure.id,
      academicYearId: academicYear.id,
    },
  });
  if (!studentFee) {
    studentFee = await prisma.studentFee.create({
      data: {
        tenantId: demoTenant.id,
        studentId: studentProfile.id,
        feeStructureId: feeStructure.id,
        academicYearId: academicYear.id,
        totalAmount: 35000.0,
        discountAmount: 0.0,
        netAmount: 35000.0,
        status: 'PENDING',
      },
    });
  }

  // Sample Invoice
  const invoiceNumber = `INV-${demoTenant.code}-2025-001`;
  let invoice = await prisma.invoice.findFirst({
    where: { tenantId: demoTenant.id, invoiceNumber },
  });
  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        tenantId: demoTenant.id,
        invoiceNumber,
        studentId: studentProfile.id,
        academicYearId: academicYear.id,
        issueDate: new Date('2025-06-10'),
        dueDate: new Date('2025-07-10'),
        subtotal: 35000.0,
        taxAmount: 0.0,
        discountAmount: 0.0,
        totalAmount: 35000.0,
        paidAmount: 0.0,
        status: 'ISSUED',
        lines: {
          create: [
            {
              tenantId: demoTenant.id,
              studentFeeId: studentFee.id,
              description: 'Class 10 - Term 1 Tuition Fee',
              quantity: 1,
              unitPrice: 35000.0,
              totalAmount: 35000.0,
            },
          ],
        },
      },
    });
  }

  // -------------------------------------------------------------
  // 9. SAMPLE ATTENDANCE RECORD
  // -------------------------------------------------------------
  const existingAttendance = await prisma.studentAttendance.findFirst({
    where: {
      tenantId: demoTenant.id,
      studentId: studentProfile.id,
      sectionId: sectionA.id,
    },
  });

  if (!existingAttendance) {
    const today = new Date();
    await prisma.studentAttendance.create({
      data: {
        tenantId: demoTenant.id,
        studentId: studentProfile.id,
        sectionId: sectionA.id,
        date: today,
        status: 'PRESENT',
        recordedById: teacherUser.id,
        remarks: 'Present on time',
      },
    });
  }

  console.log('\n======================================================');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  console.log('Credentials for local development:\n');
  console.log(`[Platform Super Admin]`);
  console.log(`  Email:    ${superAdminEmail}`);
  console.log(`  Password: ${superAdminPassword}\n`);
  console.log(`[Demo Tenant - Greenwood International School (GWIS)]`);
  console.log(`  School Admin:   admin@greenwood.edu / ${tenantAdminPassword}`);
  console.log(`  Principal:      principal@greenwood.edu / ${tenantAdminPassword}`);
  console.log(`  Teacher:        teacher.sharma@greenwood.edu / ${teacherPassword}`);
  console.log(`  Student:        student.aarav@greenwood.edu / ${studentPassword}`);
  console.log(`  Parent:         parent.patel@greenwood.edu / ${parentPassword}`);
  console.log(`  Accountant:     accountant@greenwood.edu / ${accountantPassword}`);
  console.log('======================================================\n');
}

// Execute directly if run as CLI script
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .catch((err) => {
      console.error('❌ Seeding failed with error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
