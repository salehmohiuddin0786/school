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

    let teachers = [];

    if (session.tenantId) {
      let sql = `
        SELECT 
          t.id,
          t.employeeCode,
          t.designation,
          t.qualification,
          t.specialization,
          u.firstName as fname,
          u.lastName as lname,
          u.email,
          u.phone,
          camp.name as campusName,
          COUNT(DISTINCT te.id) as scheduledPeriods
        FROM schoolnext_erp.teacherprofile t
        JOIN schoolnext_erp.user u ON t.userId = u.id
        LEFT JOIN schoolnext_erp.campus camp ON t.campusId = camp.id
        LEFT JOIN schoolnext_erp.timetableentry te ON t.id = te.teacherProfileId
        WHERE t.tenantId = ?
      `;
      const params = [session.tenantId];

      if (search) {
        sql += ` AND (u.firstName LIKE ? OR u.lastName LIKE ? OR t.employeeCode LIKE ? OR u.email LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q);
      }

      sql += ` GROUP BY t.id ORDER BY t.createdAt DESC LIMIT 100`;

      const rows = await query(sql, params);
      teachers = rows.map((r) => ({
        id: r.id,
        employeeCode: r.employeeCode,
        fname: r.fname,
        lname: r.lname,
        email: r.email,
        phone: r.phone,
        designation: r.designation || 'Faculty',
        qualification: r.qualification || 'N/A',
        specialization: r.specialization || 'General',
        campus: r.campusName || 'Main Campus',
        scheduledPeriods: Number(r.scheduledPeriods || 0),
      }));
    } else {
      let sql = `SELECT id, fname, lname, subject, class, section, phone, email, qualification FROM teachers WHERE 1=1`;
      const params = [];
      if (search) {
        sql += ` AND (fname LIKE ? OR lname LIKE ? OR email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      sql += ` ORDER BY id DESC LIMIT 100`;
      teachers = await query(sql, params);
    }

    return NextResponse.json({ status: 'success', teachers });
  } catch (error) {
    console.error('Owner teachers error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
