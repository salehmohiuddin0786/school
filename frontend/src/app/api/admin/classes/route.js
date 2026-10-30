import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

let tableChecked = false;
async function ensureClassesTable() {
  if (tableChecked) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS classes (
        s_no int NOT NULL AUTO_INCREMENT,
        class varchar(50) NOT NULL,
        section varchar(50) NOT NULL DEFAULT 'A',
        fees int NOT NULL DEFAULT '0',
        PRIMARY KEY (s_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tableChecked = true;
  } catch (err) {
    console.warn('ensureClassesTable warning:', err.message);
  }
}

export async function GET() {
  try {
    await ensureClassesTable();
    let classes = [];

    // 1. Fetch from classes table if it exists
    try {
      const dbClasses = await query('SELECT s_no, class, section, fees FROM classes ORDER BY class ASC, section ASC');
      if (Array.isArray(dbClasses)) {
        classes = [...dbClasses];
      }
    } catch (e) {
      console.warn('Classes table query fallback:', e.message);
    }

    // 2. Also union with course / section from schoolnext_erp
    try {
      const courses = await query(
        `SELECT c.id as s_no, c.name as class, COALESCE(s.name, 'A') as section, 0 as fees 
         FROM course c 
         LEFT JOIN section s ON s.courseId = c.id 
         ORDER BY c.name ASC, s.name ASC`
      );
      if (Array.isArray(courses) && courses.length > 0) {
        const existingKeys = new Set(classes.map(c => `${c.class}-${c.section}`.toLowerCase()));
        for (const cr of courses) {
          const key = `${cr.class}-${cr.section}`.toLowerCase();
          if (!existingKeys.has(key)) {
            classes.push(cr);
            existingKeys.add(key);
          }
        }
      }
    } catch (e) {
      // course table fallback
    }

    return NextResponse.json({ status: 'success', classes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureClassesTable();
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const className = (body.className || body.class || '').trim();
    const section = (body.section || 'A').trim();
    const fees = parseInt(body.fees, 10) || 0;

    if (!className) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    await query(
      'INSERT INTO classes (class, section, fees) VALUES (?, ?, ?)',
      [className, section, fees]
    );

    return NextResponse.json({ status: 'success', message: 'Class added successfully' });
  } catch (error) {
    console.error('Classes POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await ensureClassesTable();
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('s_no');
    if (!id) return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });

    await query('DELETE FROM classes WHERE s_no = ?', [id]);
    return NextResponse.json({ status: 'success', message: 'Class deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
