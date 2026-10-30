import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'owner') {
      return NextResponse.json({ status: 'error', message: 'Unauthorized. Owner portal access only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let students = [];

    if (session.tenantId) {
      // Query canonical multi-tenant schoolnext_erp database
      let sql = `
        SELECT 
          s.id,
          s.admissionNumber as roll_no,
          u.firstName as fname,
          u.lastName as lname,
          u.email,
          u.phone,
          s.gender,
          COALESCE(e.status, u.status, 'ACTIVE') as status,
          c.name as class,
          sec.name as section,
          camp.name as campusName,
          MIN(pUser.firstName) as fatherFname,
          MIN(pUser.lastName) as fatherLname,
          MIN(pUser.phone) as fatherPhone
        FROM schoolnext_erp.student s
        JOIN schoolnext_erp.user u ON s.userId = u.id
        LEFT JOIN schoolnext_erp.campus camp ON s.campusId = camp.id
        LEFT JOIN schoolnext_erp.enrollment e ON s.id = e.studentId AND e.status = 'ACTIVE'
        LEFT JOIN schoolnext_erp.section sec ON e.sectionId = sec.id
        LEFT JOIN schoolnext_erp.course c ON sec.courseId = c.id
        LEFT JOIN schoolnext_erp.studentparent sp ON s.id = sp.studentId
        LEFT JOIN schoolnext_erp.parentprofile pp ON sp.parentProfileId = pp.id
        LEFT JOIN schoolnext_erp.user pUser ON pp.userId = pUser.id
        WHERE s.tenantId = ?
      `;
      const params = [session.tenantId];

      if (search) {
        sql += ` AND (u.firstName LIKE ? OR u.lastName LIKE ? OR s.admissionNumber LIKE ? OR u.email LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q);
      }

      sql += ` GROUP BY s.id, e.id, c.id, sec.id, camp.id ORDER BY s.createdAt DESC LIMIT 100`;

      const rows = await query(sql, params);
      students = rows.map((r) => ({
        id: r.id,
        roll_no: r.roll_no,
        fname: r.fname,
        lname: r.lname,
        email: r.email,
        phone: r.phone,
        gender: r.gender,
        class: r.class || 'Class 10',
        section: r.section || 'A',
        campus: r.campusName || 'Main Campus',
        father: r.fatherFname ? `${r.fatherFname} ${r.fatherLname || ''}`.trim() : 'N/A',
        fatherPhone: r.fatherPhone || '',
        status: r.status,
      }));
    } else {
      // Legacy fallback
      let sql = `SELECT id, roll_no, fname, lname, class, section, father, phone, gender, email FROM students WHERE 1=1`;
      const params = [];
      if (search) {
        sql += ` AND (fname LIKE ? OR lname LIKE ? OR email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      sql += ` ORDER BY id DESC LIMIT 100`;
      students = await query(sql, params);
    }

    return NextResponse.json({ status: 'success', students });
  } catch (error) {
    console.error('Owner students error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
