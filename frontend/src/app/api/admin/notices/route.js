import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const notices = await query('SELECT * FROM notice ORDER BY s_no DESC');
    return NextResponse.json({ status: 'success', notices: notices || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message, notices: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: noticeBody, importance = '1', role = 'all', className = 'all' } = body;

    const cleanTitle = (title || '').trim();
    const cleanBody = (noticeBody || '').trim();

    if (!cleanTitle || !cleanBody) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    let validTenantId = null;
    if (session.tenantId) {
      try {
        const checkTenant = await queryOne('SELECT id FROM tenant WHERE id = ?', [session.tenantId]);
        if (checkTenant) validTenantId = checkTenant.id;
      } catch (err) {
        console.warn('Tenant check warning:', err.message);
      }
    }
    if (!validTenantId) {
      const tenantRow = await queryOne('SELECT id FROM tenant LIMIT 1');
      validTenantId = tenantRow?.id || 'a30ecf76-6525-407b-b180-bd9b681799f1';
    }

    let publishedById = null;
    if (session.id) {
      try {
        const userExists = await queryOne('SELECT id FROM user WHERE id = ?', [session.id]);
        if (userExists) publishedById = userExists.id;
      } catch (err) {
        // fallback
      }
    }

    let targetAudience = 'ALL';
    const cleanRole = String(role || '').toLowerCase();
    if (cleanRole === 'teacher' || cleanRole === 'teachers' || cleanRole === 'faculty') {
      targetAudience = 'TEACHERS';
    } else if (cleanRole === 'student' || cleanRole === 'students') {
      targetAudience = 'STUDENTS';
    } else if (cleanRole === 'parent' || cleanRole === 'parents') {
      targetAudience = 'PARENTS';
    }

    const isUrgent = (importance === '1' || importance === 'urgent' || importance === 'high') ? 1 : 0;
    const noticeId = 'not_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);

    await query(
      `INSERT INTO notice (
        id, tenantId, title, content, body, sender_id, editor_id, publishedById, targetAudience, isUrgent, file, importance, role, class, timestamp, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        noticeId,
        validTenantId,
        cleanTitle,
        cleanBody,
        cleanBody,
        session.id || 'admin',
        session.id || 'admin',
        publishedById,
        targetAudience,
        isUrgent,
        '',
        importance,
        role,
        className,
      ]
    );

    return NextResponse.json({ status: 'success', message: 'Notice posted successfully', id: noticeId });
  } catch (error) {
    console.error('Notice POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notice id is required' }, { status: 400 });
    }

    await query('DELETE FROM notice WHERE s_no = ? OR id = ?', [id, id]);
    return NextResponse.json({ status: 'success', message: 'Notice deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
