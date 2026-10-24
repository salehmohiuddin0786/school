import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const notices = await query('SELECT * FROM notice ORDER BY s_no DESC');
    return NextResponse.json({ status: 'success', notices });
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
    const { title, body: noticeBody, importance = '1', role = 'all', className = 'all' } = body;

    if (!title || !noticeBody) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    await query(
      `INSERT INTO notice (sender_id, editor_id, title, body, file, importance, role, class, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [session.id, session.id, title, noticeBody, '', importance, role, className]
    );

    return NextResponse.json({ status: 'success', message: 'Notice posted successfully' });
  } catch (error) {
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

    await query('DELETE FROM notice WHERE s_no = ?', [id]);
    return NextResponse.json({ status: 'success', message: 'Notice deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
