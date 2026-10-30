import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

let tableChecked = false;
async function ensureSubjectsTable() {
  if (tableChecked) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS subjects (
        s_no int NOT NULL AUTO_INCREMENT,
        subject_id varchar(40) NOT NULL,
        subject_name varchar(100) NOT NULL,
        class varchar(50) NOT NULL,
        PRIMARY KEY (s_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tableChecked = true;
  } catch (err) {
    console.warn('ensureSubjectsTable warning:', err.message);
  }
}

export async function GET(request) {
  try {
    await ensureSubjectsTable();
    const { searchParams } = new URL(request.url);
    const className = (searchParams.get('class') || '').trim();
    const rawClass = className ? className.replace(/^Class\s+/i, '').trim() : '';

    const combinedSubjects = [];

    // 1. Query legacy `subjects` table
    try {
      let sql = 'SELECT s_no, subject_id, subject_name, class FROM subjects WHERE 1=1';
      const params = [];

      if (className) {
        sql += ' AND (class = ? OR class = ?)';
        params.push(className, rawClass);
      }

      sql += ' ORDER BY s_no DESC';
      const legacyRows = await query(sql, params);
      if (Array.isArray(legacyRows)) {
        combinedSubjects.push(...legacyRows);
      }
    } catch (legacyErr) {
      console.warn('Legacy subjects query fallback:', legacyErr.message);
    }

    // 2. Query canonical multi-tenant `subject` table joined with class & course
    try {
      let erpSql = `
        SELECT 
          cs.id as s_no,
          s.id as subject_id,
          s.name as subject_name,
          COALESCE(c.name, 'Class 10') as class
        FROM subject s
        LEFT JOIN classsubject cs ON cs.subjectId = s.id
        LEFT JOIN section sec ON cs.sectionId = sec.id
        LEFT JOIN course c ON sec.courseId = c.id
        WHERE 1=1
      `;
      const erpParams = [];

      if (className) {
        erpSql += ' AND (c.name = ? OR c.name = ? OR c.code = ?)';
        erpParams.push(className, `Class ${rawClass}`, `CLS-${rawClass}`);
      }

      erpSql += ' ORDER BY s.name ASC';
      const erpRows = await query(erpSql, erpParams);

      if (Array.isArray(erpRows)) {
        const existingKeys = new Set(
          combinedSubjects.map(s => `${(s.subject_name || '').toLowerCase()}-${(s.class || '').toLowerCase()}`)
        );

        for (const er of erpRows) {
          const key = `${(er.subject_name || '').toLowerCase()}-${(er.class || '').toLowerCase()}`;
          if (!existingKeys.has(key)) {
            existingKeys.add(key);
            combinedSubjects.push(er);
          }
        }
      }
    } catch (erpErr) {
      console.warn('Canonical subject query fallback:', erpErr.message);
    }

    return NextResponse.json({ status: 'success', subjects: combinedSubjects });
  } catch (error) {
    console.error('Subjects GET error:', error);
    return NextResponse.json({ status: 'error', error: error.message, subjects: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureSubjectsTable();
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const subject_name = (body.subject_name || body.name || '').trim();
    const className = (body.className || body.class || '').trim();

    if (!subject_name || !className) {
      return NextResponse.json({ error: 'Subject name and class are required' }, { status: 400 });
    }

    const subjectId = 'SUB' + Date.now().toString().slice(-6);

    // 1. Insert into legacy subjects table
    await query(
      'INSERT INTO subjects (subject_id, subject_name, class) VALUES (?, ?, ?)',
      [subjectId, subject_name, className]
    );

    // 2. Canonical ERP synchronization (best-effort)
    try {
      const canonicalSubExists = await queryOne('SELECT id FROM subject WHERE name = ?', [subject_name]);
      let canonicalSubId = canonicalSubExists?.id;

      if (!canonicalSubId) {
        canonicalSubId = crypto.randomUUID();
        const tenantId = session.tenantId || 'schoolnext-default';
        const code = subject_name.slice(0, 4).toUpperCase() + '-' + Date.now().toString().slice(-3);

        await query(
          `INSERT INTO subject (id, tenantId, code, name, creditHours, isElective, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 4.00, 0, NOW(), NOW())`,
          [canonicalSubId, tenantId, code, subject_name]
        );
      }
    } catch (erpSyncErr) {
      console.warn('Canonical subject sync warning:', erpSyncErr.message);
    }

    return NextResponse.json({ status: 'success', message: 'Subject created successfully' });
  } catch (error) {
    console.error('Subjects POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await ensureSubjectsTable();
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('s_no') || searchParams.get('subject_id');
    if (!id) return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });

    await query('DELETE FROM subjects WHERE s_no = ? OR subject_id = ?', [id, id]);
    return NextResponse.json({ status: 'success', message: 'Subject deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
