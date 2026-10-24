import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const leaves = await query(`
      SELECT 
        l.s_no,
        l.sender_id,
        t.fname,
        t.lname,
        t.email,
        l.leave_type,
        l.leave_desc,
        l.start_date,
        l.end_date,
        l.leave_days,
        l.status,
        l.send_date
      FROM leaves l
      LEFT JOIN teachers t ON CONVERT(l.sender_id USING utf8mb4) = CONVERT(t.id USING utf8mb4)
      ORDER BY l.s_no DESC
    `);

    return NextResponse.json({ status: 'success', leaves });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { leaveId, status } = body;

    if (!leaveId || !status) {
      return NextResponse.json({ error: 'leaveId and status are required' }, { status: 400 });
    }

    await query('UPDATE leaves SET status = ? WHERE s_no = ?', [status, leaveId]);

    return NextResponse.json({ status: 'success', message: `Leave ${status} successfully` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
