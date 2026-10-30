import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const student = await queryOne(
      `SELECT 
        s_no, id, id as admission_number, roll_no, academic_year,
        fname, lname, father, gender, class, section, dob, image,
        phone, email, address, city, zip, state, bus_id, request_date,
        CASE 
          WHEN request = 'approved' OR request = '' OR request IS NULL THEN 'ACTIVE'
          WHEN request = 'pending' THEN 'PENDING'
          ELSE 'INACTIVE'
        END as status
      FROM students WHERE id = ?`,
      [id]
    );

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', student });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      fname,
      lname,
      father,
      gender,
      className,
      section,
      dob,
      phone,
      address,
      city,
      zip,
      state,
      roll_no,
      academic_year,
      bus_id,
      status,
    } = body;

    const existing = await queryOne('SELECT s_no FROM students WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const requestVal = status === 'ACTIVE' ? 'approved' : status === 'PENDING' ? 'pending' : 'rejected';

    await query(
      `UPDATE students SET 
        fname = COALESCE(?, fname),
        lname = COALESCE(?, lname),
        father = COALESCE(?, father),
        gender = COALESCE(?, gender),
        class = COALESCE(?, class),
        section = COALESCE(?, section),
        dob = COALESCE(?, dob),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        zip = COALESCE(?, zip),
        state = COALESCE(?, state),
        roll_no = COALESCE(?, roll_no),
        academic_year = COALESCE(?, academic_year),
        bus_id = COALESCE(?, bus_id),
        request = ?
      WHERE id = ?`,
      [
        fname, lname, father, gender, className, section,
        dob, phone, address, city, zip, state,
        roll_no, academic_year, bus_id, requestVal, id
      ]
    );

    return NextResponse.json({ status: 'success', message: 'Student updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await query('DELETE FROM students WHERE id = ?', [id]);
    await query('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ status: 'success', message: 'Student removed successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
