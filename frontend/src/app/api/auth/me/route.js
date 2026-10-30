import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let profile = { ...session };

    if (session.role === 'admin') {
      const admin = await queryOne('SELECT fname, lname, image, phone, address FROM admins WHERE id = ?', [session.id]);
      if (admin) {
        profile.name = `${admin.fname} ${admin.lname}`.trim();
        profile.image = admin.image;
        profile.phone = admin.phone;
        profile.address = admin.address;
      }
    } else if (session.role === 'teacher') {
      const teacher = await queryOne('SELECT fname, lname, image, subject, class, section, phone, address FROM teachers WHERE id = ?', [session.id]);
      if (teacher) {
        profile.name = `${teacher.fname} ${teacher.lname}`.trim();
        profile.image = teacher.image;
        profile.subject = teacher.subject;
        profile.class = teacher.class;
        profile.section = teacher.section;
        profile.phone = teacher.phone;
        profile.address = teacher.address;
      }
    } else if (session.role === 'student') {
      const student = await queryOne('SELECT fname, lname, image, class, section, father, phone, address FROM students WHERE id = ?', [session.id]);
      if (student) {
        profile.name = `${student.fname} ${student.lname}`.trim();
        profile.image = student.image;
        profile.class = student.class;
        profile.section = student.section;
        profile.father = student.father;
        profile.phone = student.phone;
        profile.address = student.address;
      }
    } else if (session.role === 'owner') {
      profile.name = session.name || 'School Executive / Owner';
      profile.image = '1701517055user.png';
    } else if (session.role === 'parent') {
      profile.name = session.name || 'Parent / Guardian';
      profile.image = '1701517055user.png';
    }

    return NextResponse.json({ authenticated: true, user: profile });
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}
