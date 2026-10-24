import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const classes = await query('SELECT s_no, class, section, fees FROM classes ORDER BY class ASC, section ASC');
    return NextResponse.json({ status: 'success', classes });
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
    const { className, section, fees } = body;

    if (!className) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    await query(
      'INSERT INTO classes (class, section, fees) VALUES (?, ?, ?)',
      [className, section || 'A', parseInt(fees, 10) || 0]
    );

    return NextResponse.json({ status: 'success', message: 'Class added successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
