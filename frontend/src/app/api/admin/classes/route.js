import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
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
