import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, createToken, AUTH_COOKIE } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await queryOne(
      'SELECT id, email, role, password_hash, theme FROM users WHERE email = ?',
      [email.trim()]
    );

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid email or password!' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid email or password!' },
        { status: 401 }
      );
    }

    // Fetch user profile details based on role
    let profile = { id: user.id, email: user.email, role: user.role };

    if (user.role === 'admin') {
      const admin = await queryOne('SELECT fname, lname, image FROM admins WHERE id = ?', [user.id]);
      if (admin) profile.name = `${admin.fname} ${admin.lname}`.trim();
      profile.image = admin?.image || '1701517055user.png';
    } else if (user.role === 'teacher') {
      const teacher = await queryOne('SELECT fname, lname, image, subject, class, section FROM teachers WHERE id = ?', [user.id]);
      if (teacher) {
        profile.name = `${teacher.fname} ${teacher.lname}`.trim();
        profile.subject = teacher.subject;
        profile.class = teacher.class;
        profile.section = teacher.section;
      }
      profile.image = teacher?.image || '1701517055user.png';
    } else if (user.role === 'student') {
      const student = await queryOne('SELECT fname, lname, image, class, section FROM students WHERE id = ?', [user.id]);
      if (student) {
        profile.name = `${student.fname} ${student.lname}`.trim();
        profile.class = student.class;
        profile.section = student.section;
      }
      profile.image = student?.image || '1701517055user.png';
    } else if (user.role === 'owner') {
      profile.name = 'School Executive / Owner';
      profile.image = '1701517055user.png';
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: profile.name || user.email,
    });

    const response = NextResponse.json({
      status: 'success',
      role: user.role,
      user: profile,
    });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
