import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get('class');

    let sql = 'SELECT s_no, subject_id, subject_name, class FROM subjects WHERE 1=1';
    const params = [];

    if (className) {
      sql += ' AND class = ?';
      params.push(className);
    }

    sql += ' ORDER BY s_no DESC';
    const subjects = await query(sql, params);

    return NextResponse.json({ status: 'success', subjects });
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
    const { subject_name, className } = body;

    if (!subject_name || !className) {
      return NextResponse.json({ error: 'Subject name and class are required' }, { status: 400 });
    }

    const subjectId = 'SUB' + Date.now().toString().slice(-6);

    await query(
      'INSERT INTO subjects (subject_id, subject_name, class) VALUES (?, ?, ?)',
      [subjectId, subject_name, className]
    );

    return NextResponse.json({ status: 'success', message: 'Subject created successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
