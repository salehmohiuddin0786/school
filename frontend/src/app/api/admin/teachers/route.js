import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let sql = 'SELECT s_no, id, fname, lname, father, subject, gender, dob, image, phone, email, address, city, state, class, section FROM teachers WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (fname LIKE ? OR lname LIKE ? OR email LIKE ? OR subject LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY s_no DESC';
    const teachers = await query(sql, params);

    return NextResponse.json({ status: 'success', teachers });
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
      subject,
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

    if (!fname || !email || !subject) {
      return NextResponse.json({ error: 'First name, email and subject are required' }, { status: 400 });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    const teacherId = 'T' + Date.now().toString().slice(-9);
    const passwordHash = await hashPassword(password);

    await query(
      'INSERT INTO users (id, email, password_hash, role, theme) VALUES (?, ?, ?, ?, ?)',
      [teacherId, email, passwordHash, 'teacher', 'light']
    );

    await query(
      `INSERT INTO teachers 
       (id, fname, lname, father, subject, gender, dob, image, phone, email, address, city, zip, state, class, section) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        teacherId,
        fname,
        lname || '',
        father || '',
        subject,
        gender || 'Male',
        dob || '',
        '1701517055user.png',
        phone || '',
        email,
        address || '',
        city || '',
        zip || '',
        state || '',
        className || '',
        section || '',
      ]
    );

    return NextResponse.json({ status: 'success', message: 'Teacher added successfully', id: teacherId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
