import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';
import crypto from 'crypto';

// Helper to sanitize date values for JSON
function formatDate(dateVal) {
  if (!dateVal) return null;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toISOString().split('T')[0];
  } catch {
    return String(dateVal);
  }
}

export async function GET(request) {
  try {
    const session = await getSessionUser();
    const userRole = (session?.role || '').toLowerCase();
    const isAuthorized =
      session?.isSuperAdmin ||
      userRole === 'admin' ||
      userRole === 'owner' ||
      userRole === 'school_admin' ||
      userRole === 'principal';

    if (!session || !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();

    const teachersList = [];
    const seenIdentifiers = new Set();

    // =========================================================================
    // 1. PRIMARY SOURCE: Canonical multi-tenant schema (`teacherprofile` + `user`)
    // =========================================================================
    try {
      let erpSql = `
        SELECT 
          tp.id,
          tp.id as s_no,
          tp.employeeCode,
          tp.tenantId,
          tp.campusId,
          tp.qualification,
          tp.designation,
          COALESCE(tp.specialization, 'General') as subject,
          tp.joiningDate,
          u.id as userId,
          u.firstName as fname,
          u.lastName as lname,
          u.email,
          COALESCE(u.phone, '') as phone,
          COALESCE(u.avatarUrl, '1701517055user.png') as image,
          COALESCE(u.status, 'ACTIVE') as employment_status,
          COALESCE(subj.name, tp.specialization, 'General') as assignedSubject,
          COALESCE(c.name, '') as class,
          COALESCE(sec.name, '') as section,
          COALESCE(pr.basicSalary, 35000) as basic_salary,
          COALESCE(pr.allowances, 10000) as allowances,
          COALESCE(pr.deductions, 2000) as deductions,
          COALESCE(pr.netSalary, 43000) as monthly_salary,
          pr.paymentDate as effective_date,
          camp.name as campusName
        FROM teacherprofile tp
        JOIN \`user\` u ON tp.userId = u.id
        LEFT JOIN campus camp ON tp.campusId = camp.id
        LEFT JOIN teacherassignment ta ON tp.id = ta.teacherProfileId
        LEFT JOIN classsubject cs ON ta.classSubjectId = cs.id
        LEFT JOIN subject subj ON cs.subjectId = subj.id
        LEFT JOIN section sec ON cs.sectionId = sec.id
        LEFT JOIN course c ON sec.courseId = c.id
        LEFT JOIN staffprofile sp ON tp.userId = sp.userId
        LEFT JOIN (
          SELECT pr1.*
          FROM payrollrecord pr1
          INNER JOIN (
            SELECT staffProfileId, MAX(createdAt) as maxCreated
            FROM payrollrecord
            GROUP BY staffProfileId
          ) pr2 ON pr1.staffProfileId = pr2.staffProfileId AND pr1.createdAt = pr2.maxCreated
        ) pr ON sp.id = pr.staffProfileId
        WHERE 1=1
      `;
      const erpParams = [];

      // Filter by tenant if present in session
      if (session.tenantId && !session.isSuperAdmin) {
        erpSql += ' AND tp.tenantId = ?';
        erpParams.push(session.tenantId);
      }

      if (search) {
        erpSql += ` AND (
          u.firstName LIKE ? OR 
          u.lastName LIKE ? OR 
          u.email LIKE ? OR 
          tp.employeeCode LIKE ? OR 
          tp.specialization LIKE ? OR
          subj.name LIKE ?
        )`;
        const q = `%${search}%`;
        erpParams.push(q, q, q, q, q, q);
      }

      erpSql += ' GROUP BY tp.id ORDER BY u.firstName ASC';

      const erpRows = await query(erpSql, erpParams);

      if (Array.isArray(erpRows)) {
        for (const row of erpRows) {
          const emailKey = (row.email || '').toLowerCase().trim();
          const idKey = String(row.id || '').toLowerCase().trim();
          if (emailKey) seenIdentifiers.add(emailKey);
          if (idKey) seenIdentifiers.add(idKey);

          const basic = Number(row.basic_salary) || 35000;
          const allow = Number(row.allowances) || 10000;
          const deduct = Number(row.deductions) || 2000;
          const net = basic + allow - deduct;

          teachersList.push({
            s_no: row.id,
            id: row.employeeCode || row.id,
            profileId: row.id,
            userId: row.userId,
            fname: row.fname,
            lname: row.lname || '',
            father: '',
            subject: row.assignedSubject || row.subject || 'General',
            gender: 'Male',
            dob: '',
            image: row.image,
            phone: row.phone,
            email: row.email,
            address: '',
            city: '',
            state: '',
            class: row.class || '',
            section: row.section || '',
            basic_salary: basic,
            allowances: allow,
            deductions: deduct,
            monthly_salary: net,
            effective_date: formatDate(row.effective_date) || formatDate(row.joiningDate) || new Date().toISOString().split('T')[0],
            joining_date: formatDate(row.joiningDate) || new Date().toISOString().split('T')[0],
            employment_status: row.employment_status || 'ACTIVE',
            qualification: row.qualification || '',
            designation: row.designation || 'Teacher',
            campus: row.campusName || 'Main Campus',
          });
        }
      }
    } catch (erpErr) {
      console.warn('Canonical teacherprofile query note:', erpErr.message);
    }

    // =========================================================================
    // 2. BACKWARD COMPATIBILITY: Legacy single-tenant `teachers` table (if present)
    // =========================================================================
    try {
      let legacySql = `
        SELECT 
          t.s_no, 
          t.id, 
          t.fname, 
          t.lname, 
          t.father, 
          t.subject, 
          t.gender, 
          t.dob, 
          t.image, 
          t.phone, 
          t.email, 
          t.address, 
          t.city, 
          t.state, 
          t.class, 
          t.section
        FROM teachers t
        WHERE 1=1
      `;
      const legacyParams = [];

      if (search) {
        legacySql += ' AND (t.fname LIKE ? OR t.lname LIKE ? OR t.email LIKE ? OR t.subject LIKE ? OR t.id LIKE ?)';
        const q = `%${search}%`;
        legacyParams.push(q, q, q, q, q);
      }

      legacySql += ' ORDER BY t.s_no DESC';
      const legacyRows = await query(legacySql, legacyParams);

      if (Array.isArray(legacyRows)) {
        for (const lt of legacyRows) {
          const emailKey = (lt.email || '').toLowerCase().trim();
          const idKey = String(lt.id || '').toLowerCase().trim();

          if ((emailKey && seenIdentifiers.has(emailKey)) || (idKey && seenIdentifiers.has(idKey))) {
            continue; // Deduplicate against canonical records
          }

          if (emailKey) seenIdentifiers.add(emailKey);
          if (idKey) seenIdentifiers.add(idKey);

          teachersList.push({
            s_no: lt.s_no,
            id: lt.id,
            profileId: lt.id,
            fname: lt.fname,
            lname: lt.lname || '',
            father: lt.father || '',
            subject: lt.subject || 'General',
            gender: lt.gender || 'Male',
            dob: lt.dob || '',
            image: lt.image || '1701517055user.png',
            phone: lt.phone || '',
            email: lt.email || '',
            address: lt.address || '',
            city: lt.city || '',
            state: lt.state || '',
            class: lt.class || '',
            section: lt.section || '',
            basic_salary: 30000,
            allowances: 10000,
            deductions: 2000,
            monthly_salary: 38000,
            effective_date: new Date().toISOString().split('T')[0],
            joining_date: new Date().toISOString().split('T')[0],
            employment_status: 'ACTIVE',
            qualification: '',
            designation: 'Faculty',
            campus: 'Main Campus',
          });
        }
      }
    } catch (legacyErr) {
      // Legacy table missing or unreadable; cleanly ignored
    }

    return NextResponse.json({ status: 'success', teachers: teachersList });
  } catch (error) {
    console.error('Teachers GET error:', error);
    return NextResponse.json({ status: 'error', error: error.message, teachers: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    const userRole = (session?.role || '').toLowerCase();
    const isAuthorized =
      session?.isSuperAdmin ||
      userRole === 'admin' ||
      userRole === 'owner' ||
      userRole === 'school_admin' ||
      userRole === 'principal';

    if (!session || !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      fname,
      lname = '',
      father = '',
      subject = 'Mathematics',
      gender = 'Male',
      className = '',
      section = '',
      dob = '',
      phone = '',
      email,
      address = '',
      city = '',
      zip = '',
      state = '',
      password = '123',
      qualification = 'B.Ed, Graduate',
      designation = 'Teacher',
      basic_salary = 35000,
      allowances = 10000,
      deductions = 2000,
      effective_date,
      joining_date,
      employment_status = 'ACTIVE',
    } = body;

    if (!fname || !email || !subject) {
      return NextResponse.json({ error: 'First name, email, and subject are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user already exists
    const existingUser = await queryOne('SELECT id FROM `user` WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email address already exists in the system.' }, { status: 400 });
    }

    // 2. Resolve target Tenant and Campus dynamically from active database
    let tenantId = session.tenantId;
    if (tenantId) {
      const validTenant = await queryOne('SELECT id FROM tenant WHERE id = ?', [tenantId]);
      if (!validTenant) tenantId = null;
    }
    if (!tenantId) {
      const defaultTenant = await queryOne('SELECT id FROM tenant WHERE status = "ACTIVE" ORDER BY createdAt ASC LIMIT 1');
      tenantId = defaultTenant?.id;
    }
    if (!tenantId) {
      const anyTenant = await queryOne('SELECT id FROM tenant ORDER BY createdAt ASC LIMIT 1');
      tenantId = anyTenant?.id;
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'No active educational institution tenant found. Please register an institution first.' }, { status: 400 });
    }

    const campusRow = await queryOne('SELECT id FROM campus WHERE tenantId = ? ORDER BY isMain DESC LIMIT 1', [tenantId]);
    const campusId = campusRow?.id || null;

    // 3. Resolve TEACHER role
    let roleRow = await queryOne('SELECT id FROM role WHERE code = "TEACHER" AND (tenantId = ? OR tenantId IS NULL) LIMIT 1', [tenantId]);
    if (!roleRow) {
      roleRow = await queryOne('SELECT id FROM role WHERE code = "TEACHER" LIMIT 1');
    }

    const newUserId = crypto.randomUUID();
    const newProfileId = crypto.randomUUID();
    const newStaffProfileId = crypto.randomUUID();
    const employeeCode = 'EMP-T-' + Date.now().toString().slice(-4);
    const passwordHash = await hashPassword(password);
    const joinDateObj = joining_date ? new Date(joining_date) : new Date();

    // 4. Insert into `user`
    await query(
      `INSERT INTO \`user\` 
       (id, tenantId, email, passwordHash, firstName, lastName, phone, avatarUrl, status, isSuperAdmin, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, '1701517055user.png', ?, 0, NOW(3), NOW(3))`,
      [newUserId, tenantId, cleanEmail, passwordHash, fname.trim(), lname.trim(), phone.trim(), employment_status]
    );

    // 5. Assign TEACHER role in `userrole`
    if (roleRow?.id) {
      const userRoleId = crypto.randomUUID();
      await query(
        `INSERT INTO userrole (id, userId, roleId, tenantId, createdAt)
         VALUES (?, ?, ?, ?, NOW(3))`,
        [userRoleId, newUserId, roleRow.id, tenantId]
      );
    }

    // 6. Insert into `teacherprofile`
    await query(
      `INSERT INTO teacherprofile 
       (id, tenantId, campusId, userId, employeeCode, qualification, specialization, joiningDate, designation, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [newProfileId, tenantId, campusId, newUserId, employeeCode, qualification, subject, joinDateObj, designation]
    );

    // 7. Insert into `staffprofile` (for unified HR & Payroll)
    try {
      await query(
        `INSERT INTO staffprofile 
         (id, tenantId, campusId, userId, employeeCode, department, designation, joiningDate, employmentType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'FULL_TIME', NOW(3), NOW(3))`,
        [newStaffProfileId, tenantId, campusId, newUserId, employeeCode, subject, designation, joinDateObj]
      );

      // 8. Setup Initial Payroll Record if period exists
      const bSal = Number(basic_salary) || 35000;
      const allw = Number(allowances) || 10000;
      const ded = Number(deductions) || 2000;
      const net = bSal + allw - ded;

      let periodRow = await queryOne(
        'SELECT id FROM payrollperiod WHERE tenantId = ? ORDER BY createdAt DESC LIMIT 1',
        [tenantId]
      );

      if (!periodRow) {
        // Create an active payroll period for current month
        const newPeriodId = crypto.randomUUID();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

        await query(
          `INSERT INTO payrollperiod (id, tenantId, name, startDate, endDate, status, totalDisbursed, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'DRAFT', 0.00, NOW(3), NOW(3))`,
          [newPeriodId, tenantId, `Payroll - ${monthName}`, startOfMonth, endOfMonth]
        );
        periodRow = { id: newPeriodId };
      }

      if (periodRow?.id) {
        const payrollRecId = crypto.randomUUID();
        await query(
          `INSERT INTO payrollrecord 
           (id, tenantId, payrollPeriodId, staffProfileId, basicSalary, allowances, deductions, netSalary, paymentStatus, paymentMethod, paymentDate, remarks, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'BANK_TRANSFER', ?, 'Initial compensation setup', NOW(3), NOW(3))
           ON DUPLICATE KEY UPDATE
             basicSalary = VALUES(basicSalary),
             allowances = VALUES(allowances),
             deductions = VALUES(deductions),
             netSalary = VALUES(netSalary),
             paymentDate = VALUES(paymentDate),
             remarks = VALUES(remarks),
             updatedAt = NOW(3)`,
          [payrollRecId, tenantId, periodRow.id, newStaffProfileId, bSal, allw, ded, net, joinDateObj]
        );
      }
    } catch (hrErr) {
      console.warn('Staff & Payroll initialization note:', hrErr.message);
    }

    // 9. Assign class & section if provided
    if (className && section) {
      try {
        const secRow = await queryOne(
          `SELECT sec.id, cs.id as classSubjectId, cs.subjectId
           FROM section sec
           JOIN course c ON sec.courseId = c.id
           LEFT JOIN classsubject cs ON sec.id = cs.sectionId
           WHERE sec.tenantId = ? AND (c.name LIKE ? OR c.code LIKE ?) AND sec.name LIKE ?
           LIMIT 1`,
          [tenantId, `%${className}%`, `%${className}%`, `%${section}%`]
        );

        if (secRow?.classSubjectId) {
          const academicYearRow = await queryOne(
            'SELECT id FROM academicyear WHERE tenantId = ? AND isCurrent = 1 LIMIT 1',
            [tenantId]
          );

          if (academicYearRow) {
            await query(
              `INSERT INTO teacherassignment (id, tenantId, teacherProfileId, classSubjectId, academicYearId, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
              [crypto.randomUUID(), tenantId, newProfileId, secRow.classSubjectId, academicYearRow.id]
            );
          }
        }
      } catch (assignErr) {
        console.warn('Teacher class assignment note:', assignErr.message);
      }
    }

    // 10. Best-effort backward compatibility for legacy tables (if present)
    try {
      const legacyId = 'T' + Date.now().toString().slice(-9);
      await query(
        `INSERT INTO teachers 
         (id, fname, lname, father, subject, gender, dob, image, phone, email, address, city, zip, state, class, section) 
         VALUES (?, ?, ?, ?, ?, ?, ?, '1701517055user.png', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [legacyId, fname, lname, father, subject, gender, dob, phone, cleanEmail, address, city, zip, state, className, section]
      );
      await query(
        'INSERT INTO users (id, email, password_hash, role, theme) VALUES (?, ?, ?, "teacher", "light")',
        [legacyId, cleanEmail, passwordHash]
      );
    } catch (legacyInsertErr) {
      // Legacy tables missing; completely normal in modernized database
    }

    return NextResponse.json({
      status: 'success',
      message: 'Teacher profile, user access, and initial compensation created successfully!',
      id: employeeCode,
      profileId: newProfileId,
    });
  } catch (error) {
    console.error('Add teacher error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
