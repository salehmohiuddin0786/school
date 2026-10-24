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
    const search = searchParams.get('search') || '';
    const className = searchParams.get('class') || '';
    const section = searchParams.get('section') || '';

    let sql = 'SELECT s_no, id, fname, lname, father, gender, class, section, dob, image, phone, email, address, city, state FROM students WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (fname LIKE ? OR lname LIKE ? OR id LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (className) {
      sql += ' AND class = ?';
      params.push(className);
    }
    if (section) {
      sql += ' AND section = ?';
      params.push(section);
    }

    sql += ' ORDER BY s_no DESC';
    const students = await query(sql, params);

    return NextResponse.json({ status: 'success', students });
  } catch (error) {
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
       (id, fname, lname, father, gender, class, section, dob, image, phone, email, address, city, zip, state, request_date, request_time, request) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME(), 'approved')`,
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
      ]
    );

    return NextResponse.json({ status: 'success', message: 'Student added successfully', id: studentId });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
