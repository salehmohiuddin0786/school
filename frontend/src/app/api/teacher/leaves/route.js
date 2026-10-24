import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const leaves = await query(`
      SELECT s_no, leave_type, leave_desc, start_date, end_date, leave_days, status, send_date 
      FROM leaves 
      WHERE sender_id = ? 
      ORDER BY s_no DESC
    `, [session.id]);

    return NextResponse.json({ status: 'success', leaves });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { leave_type, leave_desc, start_date, end_date, leave_days } = body;

    if (!leave_type || !leave_desc || !start_date || !end_date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await query(`
      INSERT INTO leaves 
      (sender_id, leave_type, leave_desc, start_date, end_date, leave_days, status, send_date) 
      VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [session.id, leave_type, leave_desc, start_date, end_date, parseInt(leave_days, 10) || 1]);

    return NextResponse.json({ status: 'success', message: 'Leave application submitted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
