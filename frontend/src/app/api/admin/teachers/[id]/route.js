import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

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

export async function GET(request, { params }) {
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

    const { id } = await params;
    let teacher = null;
    let history = [];

    // =========================================================================
    // 1. PRIMARY: Query Canonical `teacherprofile` + `user`
    // =========================================================================
    try {
      const canonical = await queryOne(
        `SELECT 
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
          camp.name as campusName,
          sp.id as staffProfileId
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
        WHERE tp.id = ? OR tp.employeeCode = ? OR u.id = ?
        LIMIT 1`,
        [id, id, id]
      );

      if (canonical) {
        const basic = Number(canonical.basic_salary) || 35000;
        const allow = Number(canonical.allowances) || 10000;
        const deduct = Number(canonical.deductions) || 2000;
        const net = basic + allow - deduct;

        teacher = {
          s_no: canonical.id,
          id: canonical.employeeCode || canonical.id,
          profileId: canonical.id,
          userId: canonical.userId,
          staffProfileId: canonical.staffProfileId,
          fname: canonical.fname,
          lname: canonical.lname || '',
          father: '',
          subject: canonical.assignedSubject || canonical.subject || 'General',
          gender: 'Male',
          dob: '',
          image: canonical.image,
          phone: canonical.phone,
          email: canonical.email,
          address: '',
          city: '',
          state: '',
          class: canonical.class || '',
          section: canonical.section || '',
          basic_salary: basic,
          allowances: allow,
          deductions: deduct,
          monthly_salary: net,
          effective_date: formatDate(canonical.effective_date) || formatDate(canonical.joiningDate) || new Date().toISOString().split('T')[0],
          joining_date: formatDate(canonical.joiningDate) || new Date().toISOString().split('T')[0],
          employment_status: canonical.employment_status || 'ACTIVE',
          qualification: canonical.qualification || '',
          designation: canonical.designation || 'Teacher',
          campus: canonical.campusName || 'Main Campus',
        };

        // Fetch payroll compensation history
        if (canonical.staffProfileId || canonical.userId) {
          const payrollRows = await query(
            `SELECT 
              pr.id,
              pr.basicSalary as basic_salary,
              pr.allowances,
              pr.deductions,
              pr.netSalary as monthly_salary,
              COALESCE(pr.paymentDate, pr.createdAt) as effective_date,
              COALESCE(sp.joiningDate, pr.createdAt) as joining_date,
              pr.paymentStatus as employment_status,
              pr.remarks,
              pp.name as period_name,
              pr.createdAt as created_at
             FROM payrollrecord pr
             JOIN staffprofile sp ON pr.staffProfileId = sp.id
             LEFT JOIN payrollperiod pp ON pr.payrollPeriodId = pp.id
             WHERE sp.id = ? OR sp.userId = ?
             ORDER BY pr.createdAt DESC
             LIMIT 50`,
            [canonical.staffProfileId, canonical.userId]
          );

          if (Array.isArray(payrollRows) && payrollRows.length > 0) {
            history = payrollRows.map((r) => ({
              id: r.id,
              basic_salary: Number(r.basic_salary),
              allowances: Number(r.allowances),
              deductions: Number(r.deductions),
              monthly_salary: Number(r.monthly_salary),
              effective_date: formatDate(r.effective_date),
              joining_date: formatDate(r.joining_date),
              employment_status: r.employment_status || 'ACTIVE',
              remarks: r.remarks || 'Compensation record',
              updated_by: r.period_name || 'System Admin',
              created_at: formatDate(r.created_at),
            }));
          }
        }
      }
    } catch (canonicalErr) {
      console.warn('Canonical teacher lookup note:', canonicalErr.message);
    }

    // =========================================================================
    // 2. FALLBACK: Legacy `teachers` table
    // =========================================================================
    if (!teacher) {
      try {
        const legacyRow = await queryOne('SELECT * FROM teachers WHERE id = ? OR s_no = ?', [id, id]);
        if (legacyRow) {
          teacher = {
            s_no: legacyRow.s_no,
            id: legacyRow.id,
            profileId: legacyRow.id,
            fname: legacyRow.fname,
            lname: legacyRow.lname || '',
            father: legacyRow.father || '',
            subject: legacyRow.subject || 'General',
            gender: legacyRow.gender || 'Male',
            dob: legacyRow.dob || '',
            image: legacyRow.image || '1701517055user.png',
            phone: legacyRow.phone || '',
            email: legacyRow.email || '',
            address: legacyRow.address || '',
            city: legacyRow.city || '',
            state: legacyRow.state || '',
            class: legacyRow.class || '',
            section: legacyRow.section || '',
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
          };
        }
      } catch (legacyErr) {
        // Missing table ignored
      }
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // If no history found yet, synthesize an initial baseline history entry
    if (history.length === 0) {
      history = [
        {
          id: 'init-1',
          basic_salary: teacher.basic_salary,
          allowances: teacher.allowances,
          deductions: teacher.deductions,
          monthly_salary: teacher.monthly_salary,
          effective_date: teacher.effective_date,
          joining_date: teacher.joining_date,
          employment_status: teacher.employment_status,
          updated_by: 'Administrator',
          remarks: 'Initial compensation structure',
          created_at: teacher.effective_date,
        },
      ];
    }

    return NextResponse.json({ status: 'success', teacher, history });
  } catch (error) {
    console.error('Teacher detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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

    const { id } = await params;
    const body = await request.json();
    const {
      fname,
      lname,
      phone,
      subject,
      qualification,
      designation,
      className,
      section,
      basic_salary,
      allowances,
      deductions,
      effective_date,
      joining_date,
      employment_status,
      remarks = 'Compensation revision',
    } = body;

    // 1. Locate canonical teacherprofile
    const canonicalTeacher = await queryOne(
      `SELECT tp.id, tp.userId, tp.tenantId, tp.campusId, tp.employeeCode, sp.id as staffProfileId 
       FROM teacherprofile tp
       LEFT JOIN staffprofile sp ON tp.userId = sp.userId
       WHERE tp.id = ? OR tp.employeeCode = ? OR tp.userId = ?`,
      [id, id, id]
    );

    if (canonicalTeacher) {
      const now = new Date();

      // Update `user` table
      if (fname !== undefined || lname !== undefined || phone !== undefined || employment_status !== undefined) {
        await query(
          `UPDATE \`user\` SET 
             firstName = COALESCE(?, firstName),
             lastName = COALESCE(?, lastName),
             phone = COALESCE(?, phone),
             status = COALESCE(?, status),
             updatedAt = NOW(3)
           WHERE id = ?`,
          [fname || null, lname || null, phone || null, employment_status || null, canonicalTeacher.userId]
        );
      }

      // Update `teacherprofile`
      if (subject !== undefined || qualification !== undefined || designation !== undefined) {
        await query(
          `UPDATE teacherprofile SET 
             specialization = COALESCE(?, specialization),
             qualification = COALESCE(?, qualification),
             designation = COALESCE(?, designation),
             updatedAt = NOW(3)
           WHERE id = ?`,
          [subject || null, qualification || null, designation || null, canonicalTeacher.id]
        );
      }

      // Update / record salary revision in `payrollrecord`
      if (basic_salary !== undefined || allowances !== undefined || deductions !== undefined) {
        let staffProfileId = canonicalTeacher.staffProfileId;

        if (!staffProfileId) {
          staffProfileId = crypto.randomUUID();
          await query(
            `INSERT INTO staffprofile 
             (id, tenantId, campusId, userId, employeeCode, department, designation, joiningDate, employmentType, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, 'Teacher', NOW(3), 'FULL_TIME', NOW(3), NOW(3))`,
            [staffProfileId, canonicalTeacher.tenantId, canonicalTeacher.campusId, canonicalTeacher.userId, canonicalTeacher.employeeCode, subject || 'Academics']
          );
        }

        const bSal = Number(basic_salary) || 35000;
        const allw = Number(allowances) || 10000;
        const ded = Number(deductions) || 2000;
        const net = bSal + allw - ded;
        const effDate = effective_date ? new Date(effective_date) : now;

        let period = await queryOne(
          'SELECT id FROM payrollperiod WHERE tenantId = ? ORDER BY createdAt DESC LIMIT 1',
          [canonicalTeacher.tenantId]
        );

        if (!period) {
          const newPeriodId = crypto.randomUUID();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

          await query(
            `INSERT INTO payrollperiod (id, tenantId, name, startDate, endDate, status, totalDisbursed, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 'DRAFT', 0.00, NOW(3), NOW(3))`,
            [newPeriodId, canonicalTeacher.tenantId, `Payroll - ${monthName}`, startOfMonth, endOfMonth]
          );
          period = { id: newPeriodId };
        }

        const newRecordId = crypto.randomUUID();
        await query(
          `INSERT INTO payrollrecord 
           (id, tenantId, payrollPeriodId, staffProfileId, basicSalary, allowances, deductions, netSalary, paymentStatus, paymentMethod, paymentDate, remarks, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'BANK_TRANSFER', ?, ?, NOW(3), NOW(3))
           ON DUPLICATE KEY UPDATE
             basicSalary = VALUES(basicSalary),
             allowances = VALUES(allowances),
             deductions = VALUES(deductions),
             netSalary = VALUES(netSalary),
             paymentDate = VALUES(paymentDate),
             remarks = VALUES(remarks),
             updatedAt = NOW(3)`,
          [newRecordId, canonicalTeacher.tenantId, period.id, staffProfileId, bSal, allw, ded, net, effDate, remarks]
        );
      }
    }

    // 2. Best-effort update legacy tables if they exist
    try {
      await query(
        `UPDATE teachers SET 
           fname = COALESCE(?, fname),
           lname = COALESCE(?, lname),
           subject = COALESCE(?, subject),
           phone = COALESCE(?, phone),
           class = COALESCE(?, class),
           section = COALESCE(?, section)
         WHERE id = ?`,
        [fname, lname, subject, phone, className, section, id]
      );
    } catch (e) {
      // Legacy table ignored
    }

    return NextResponse.json({
      status: 'success',
      message: 'Teacher profile, assigned subjects, and compensation details updated successfully!',
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    // 1. Locate and remove from canonical schema
    try {
      const canonical = await queryOne(
        `SELECT tp.id, tp.userId 
         FROM teacherprofile tp 
         WHERE tp.id = ? OR tp.employeeCode = ? OR tp.userId = ?`,
        [id, id, id]
      );

      if (canonical) {
        // Cascade delete teacher assignment, substitutions, profile, and user
        await query('DELETE FROM teacherassignment WHERE teacherProfileId = ?', [canonical.id]).catch(() => null);
        await query('DELETE FROM staffattendance WHERE teacherProfileId = ?', [canonical.id]).catch(() => null);
        await query('DELETE FROM teacherprofile WHERE id = ?', [canonical.id]).catch(() => null);
        await query('DELETE FROM staffprofile WHERE userId = ?', [canonical.userId]).catch(() => null);
        await query('DELETE FROM userrole WHERE userId = ?', [canonical.userId]).catch(() => null);
        await query('DELETE FROM `user` WHERE id = ?', [canonical.userId]).catch(() => null);
      }
    } catch (canonicalDelErr) {
      console.warn('Canonical teacher delete note:', canonicalDelErr.message);
    }

    // 2. Best-effort remove from legacy tables if present
    try {
      await query('DELETE FROM teachers WHERE id = ?', [id]);
      await query('DELETE FROM users WHERE id = ?', [id]);
    } catch (legacyDelErr) {
      // Legacy tables missing
    }

    return NextResponse.json({ status: 'success', message: 'Teacher removed successfully from system.' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
