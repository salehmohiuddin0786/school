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

    // 1. First check canonical multi-tenant schoolnext_erp database
    let user = null;
    let mappedRole = null;
    let profile = null;

    try {
      const erpUser = await queryOne(
        `SELECT u.id, u.tenantId, u.email, u.passwordHash, u.firstName, u.lastName, r.code as roleCode 
         FROM schoolnext_erp.user u 
         LEFT JOIN schoolnext_erp.userrole ur ON u.id = ur.userId 
         LEFT JOIN schoolnext_erp.role r ON ur.roleId = r.id 
         WHERE u.email = ?`,
        [email.trim().toLowerCase()]
      );

      if (erpUser) {
        const isValid = await verifyPassword(password, erpUser.passwordHash);
        if (isValid) {
          const roleCode = erpUser.roleCode || 'STUDENT';
          const ROLE_PORTAL_MAP = {
            OWNER: 'owner',
            SCHOOL_ADMIN: 'admin',
            PRINCIPAL: 'admin',
            TEACHER: 'teacher',
            STUDENT: 'student',
            PARENT: 'parent',
            ACCOUNTANT: 'admin',
            SUPER_ADMIN: 'owner',
          };

          mappedRole = ROLE_PORTAL_MAP[roleCode];
          if (!mappedRole) {
            return NextResponse.json(
              { status: 'error', message: `Access denied: Role '${roleCode}' does not have a designated web portal configured.` },
              { status: 403 }
            );
          }

          profile = {
            id: erpUser.id,
            tenantId: erpUser.tenantId,
            email: erpUser.email,
            role: mappedRole,
            name: `${erpUser.firstName || ''} ${erpUser.lastName || ''}`.trim() || erpUser.email,
            image: '1701517055user.png',
          };
          user = erpUser;
        }
      }
    } catch (e) {
      console.warn('schoolnext_erp lookup skipped:', e.message);
    }

    // 2. Fallback to legacy single-tenant users table if not authenticated above
    if (!profile) {
      const legacyUser = await queryOne(
        'SELECT id, email, role, password_hash, theme FROM users WHERE email = ?',
        [email.trim()]
      );

      if (!legacyUser) {
        return NextResponse.json(
          { status: 'error', message: 'Invalid email or password!' },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, legacyUser.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { status: 'error', message: 'Invalid email or password!' },
          { status: 401 }
        );
      }

      mappedRole = legacyUser.role;
      profile = { id: legacyUser.id, email: legacyUser.email, role: legacyUser.role };

      if (legacyUser.role === 'admin') {
        const admin = await queryOne('SELECT fname, lname, image FROM admins WHERE id = ?', [legacyUser.id]);
        if (admin) profile.name = `${admin.fname} ${admin.lname}`.trim();
        profile.image = admin?.image || '1701517055user.png';
      } else if (legacyUser.role === 'teacher') {
        const teacher = await queryOne('SELECT fname, lname, image, subject, class, section FROM teachers WHERE id = ?', [legacyUser.id]);
        if (teacher) {
          profile.name = `${teacher.fname} ${teacher.lname}`.trim();
          profile.subject = teacher.subject;
          profile.class = teacher.class;
          profile.section = teacher.section;
        }
        profile.image = teacher?.image || '1701517055user.png';
      } else if (legacyUser.role === 'student') {
        const student = await queryOne('SELECT fname, lname, image, class, section FROM students WHERE id = ?', [legacyUser.id]);
        if (student) {
          profile.name = `${student.fname} ${student.lname}`.trim();
          profile.class = student.class;
          profile.section = student.section;
        }
        profile.image = student?.image || '1701517055user.png';
      } else if (legacyUser.role === 'owner') {
        profile.name = 'School Executive / Owner';
        profile.image = '1701517055user.png';
      }
    }

    const token = createToken({
      id: profile.id,
      tenantId: profile.tenantId || null,
      email: profile.email,
      role: profile.role,
      name: profile.name || profile.email,
    });

    const response = NextResponse.json({
      status: 'success',
      role: profile.role,
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
