import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const className = (searchParams.get('class') || '').trim();
    const section = (searchParams.get('section') || '').trim();
    const academicYear = (searchParams.get('year') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    // Requirement: Do not load every student into the initial list before the class is selected.
    // If no class is selected (and no explicit search is entered), return empty list prompt.
    if (!className && !search) {
      return NextResponse.json({
        status: 'success',
        students: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
        requireClassSelection: true,
        message: 'Please select a class to view enrolled students.',
      });
    }

    let whereSql = ' WHERE 1=1';
    const params = [];

    if (className) {
      whereSql += ' AND class = ?';
      params.push(className);
    }
    if (section) {
      whereSql += ' AND section = ?';
      params.push(section);
    }
    if (academicYear) {
      whereSql += ' AND (academic_year = ? OR academic_year IS NULL)';
      params.push(academicYear);
    }
    if (search) {
      whereSql += ' AND (fname LIKE ? OR lname LIKE ? OR id LIKE ? OR roll_no LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM students ${whereSql}`, params);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated rows
    const sql = `
      SELECT 
        s_no, 
        id, 
        id as admission_number,
        roll_no,
        academic_year,
        fname, 
        lname, 
        father, 
        gender, 
        class, 
        section, 
        dob, 
        image, 
        phone, 
        email, 
        address, 
        city, 
        state,
        bus_id,
        CASE 
          WHEN request = 'approved' OR request = '' OR request IS NULL THEN 'ACTIVE'
          WHEN request = 'pending' THEN 'PENDING'
          ELSE 'INACTIVE'
        END as status
      FROM students 
      ${whereSql}
      ORDER BY s_no DESC
      LIMIT ? OFFSET ?
    `;

    const students = await query(sql, [...params, limit, offset]);

    return NextResponse.json({
      status: 'success',
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      requireClassSelection: false,
    });
  } catch (error) {
    console.error('Students GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      fname,
      lname,
      father,
      gender,
      className,
      section,
      dob,
      phone,
      email,
      address,
      city,
      zip,
      state,
      roll_no,
      academic_year = '2025-2026',
      bus_id,
      password = '123',
    } = body;

    if (!fname || !email || !className) {
      return NextResponse.json({ error: 'First name, email and class are required' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    const studentId = 'S' + Date.now().toString().slice(-9);
    const passwordHash = await hashPassword(password);

    // Insert into users
    await query(
      'INSERT INTO users (id, email, password_hash, role, theme) VALUES (?, ?, ?, ?, ?)',
      [studentId, email, passwordHash, 'student', 'light']
    );

    // Insert into students
    await query(
      `INSERT INTO students 
       (id, fname, lname, father, gender, class, section, dob, image, phone, email, address, city, zip, state, request_date, request_time, request, roll_no, academic_year, bus_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME(), 'approved', ?, ?, ?)`,
      [
        studentId,
        fname,
        lname || '',
        father || '',
        gender || 'Male',
        className,
        section || 'A',
        dob || '',
        '1701517055user.png',
        phone || '',
        email,
        address || '',
        city || '',
        zip || '',
        state || '',
        roll_no || null,
        academic_year,
        bus_id || null,
      ]
    );

    return NextResponse.json({ status: 'success', message: 'Student enrolled successfully', id: studentId });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
