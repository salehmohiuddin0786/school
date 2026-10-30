import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

let cachedColumns = null;
async function getNoticeColumns() {
  if (cachedColumns) return cachedColumns;
  try {
    const cols = await query('SHOW COLUMNS FROM notice');
    cachedColumns = new Set(cols.map(c => c.Field.toLowerCase()));
    return cachedColumns;
  } catch (err) {
    return new Set();
  }
}

export async function GET() {
  try {
    const cols = await getNoticeColumns();
    const orderClause = cols.has('s_no') ? 'ORDER BY s_no DESC' : 'ORDER BY createdAt DESC';
    const rows = await query(`SELECT * FROM notice ${orderClause}`);

    const normalizedNotices = (rows || []).map(r => ({
      s_no: r.s_no || r.id,
      id: r.id,
      title: r.title,
      body: r.body || r.content || '',
      content: r.content || r.body || '',
      role: r.role || r.targetAudience || 'ALL',
      targetAudience: r.targetAudience || r.role || 'ALL',
      importance: r.importance || (r.isUrgent ? 'urgent' : 'normal'),
      timestamp: r.timestamp || r.createdAt || new Date().toISOString(),
      sender_id: r.sender_id || r.publishedById || 'Admin'
    }));

    return NextResponse.json({ status: 'success', notices: normalizedNotices });
  } catch (error) {
    console.error('Notices GET error:', error);
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
    const { title, body: noticeBody, content, importance = '1', role = 'all', className = 'all' } = body;

    const cleanTitle = (title || '').trim();
    const textContent = (noticeBody || content || '').trim();

    if (!cleanTitle || !textContent) {
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

    const cols = await getNoticeColumns();
    const insertFields = [];
    const insertPlaceholders = [];
    const insertValues = [];

    const addField = (fieldName, val) => {
      if (cols.has(fieldName.toLowerCase())) {
        insertFields.push(fieldName);
        insertPlaceholders.push('?');
        insertValues.push(val);
      }
    };

    addField('id', noticeId);
    addField('tenantId', validTenantId);
    addField('title', cleanTitle);
    addField('content', textContent);
    addField('body', textContent);
    addField('sender_id', session.id || 'admin');
    addField('editor_id', session.id || 'admin');
    addField('publishedById', publishedById);
    addField('targetAudience', targetAudience);
    addField('isUrgent', isUrgent);
    addField('file', '');
    addField('importance', String(importance));
    addField('role', role);
    addField('class', className);

    if (cols.has('timestamp')) {
      insertFields.push('timestamp');
      insertPlaceholders.push('NOW()');
    }
    if (cols.has('createdAt')) {
      insertFields.push('createdAt');
      insertPlaceholders.push('NOW()');
    }
    if (cols.has('updatedAt')) {
      insertFields.push('updatedAt');
      insertPlaceholders.push('NOW()');
    }

    await query(
      `INSERT INTO notice (${insertFields.join(', ')}) VALUES (${insertPlaceholders.join(', ')})`,
      insertValues
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

    const cols = await getNoticeColumns();
    if (cols.has('s_no')) {
      await query('DELETE FROM notice WHERE s_no = ? OR id = ?', [id, id]);
    } else {
      await query('DELETE FROM notice WHERE id = ?', [id]);
    }

    return NextResponse.json({ status: 'success', message: 'Notice deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
