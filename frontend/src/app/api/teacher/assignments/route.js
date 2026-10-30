import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Teacher portal access only.' },
        { status: 403 }
      );
    }

    let assignments = [];
    let classSubjects = [];

    if (session.tenantId) {
      // Find teacher profile
      const tpRows = await query(
        `SELECT id FROM schoolnext_erp.teacherprofile WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [session.id, session.tenantId]
      );
      const teacherProfileId = tpRows?.[0]?.id;

      // Eligible class subjects for this tenant
      classSubjects = await query(
        `SELECT 
          cs.id,
          sub.name as subjectName,
          sub.code as subjectCode,
          sec.name as sectionName,
          c.name as courseName
        FROM schoolnext_erp.classsubject cs
        JOIN schoolnext_erp.subject sub ON cs.subjectId = sub.id
        JOIN schoolnext_erp.section sec ON cs.sectionId = sec.id
        JOIN schoolnext_erp.course c ON sec.courseId = c.id
        WHERE cs.tenantId = ?
        ORDER BY c.name ASC, sec.name ASC, sub.name ASC`,
        [session.tenantId]
      );

      // Query assignments
      let sql = `
        SELECT 
          a.id,
          a.title,
          a.description,
          a.dueDate,
          a.maxMarks,
          a.attachmentUrl,
          a.createdAt,
          sub.name as subjectName,
          sec.name as sectionName,
          c.name as courseName,
          u.firstName as teacherFname,
          u.lastName as teacherLname,
          COUNT(asub.id) as totalSubmissions
        FROM schoolnext_erp.assignment a
        JOIN schoolnext_erp.classsubject cs ON a.classSubjectId = cs.id
        JOIN schoolnext_erp.subject sub ON cs.subjectId = sub.id
        JOIN schoolnext_erp.section sec ON cs.sectionId = sec.id
        JOIN schoolnext_erp.course c ON sec.courseId = c.id
        JOIN schoolnext_erp.teacherprofile tp ON a.teacherProfileId = tp.id
        JOIN schoolnext_erp.user u ON tp.userId = u.id
        LEFT JOIN schoolnext_erp.assignmentsubmission asub ON a.id = asub.assignmentId
        WHERE a.tenantId = ?
      `;
      const params = [session.tenantId];

      if (teacherProfileId && session.role === 'teacher') {
        sql += ` AND a.teacherProfileId = ?`;
        params.push(teacherProfileId);
      }

      sql += ` GROUP BY a.id ORDER BY a.dueDate DESC LIMIT 50`;

      const rows = await query(sql, params);
      assignments = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        dueDate: r.dueDate instanceof Date ? r.dueDate.toISOString().split('T')[0] : String(r.dueDate).split('T')[0],
        maxMarks: Number(r.maxMarks || 100),
        attachmentUrl: r.attachmentUrl,
        subject: r.subjectName,
        className: `${r.courseName} - ${r.sectionName}`,
        teacher: `${r.teacherFname} ${r.teacherLname || ''}`.trim(),
        totalSubmissions: Number(r.totalSubmissions || 0),
        createdAt: r.createdAt,
      }));
    } else {
      // Legacy fallback
      assignments = [
        {
          id: 'mock-1',
          title: 'Quadratic Equations Practice Set',
          description: 'Solve questions 1 through 15 from Chapter 4. Show all intermediate workings.',
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          maxMarks: 50,
          attachmentUrl: null,
          subject: 'Mathematics',
          className: 'Class 10 - Section A',
          teacher: 'Current Faculty',
          totalSubmissions: 28,
        },
        {
          id: 'mock-2',
          title: 'Light & Reflection Laboratory Report',
          description: 'Submit formal observation tables and ray diagrams for Concave mirror experiment.',
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          maxMarks: 25,
          attachmentUrl: null,
          subject: 'Science',
          className: 'Class 9 - Section B',
          teacher: 'Current Faculty',
          totalSubmissions: 14,
        },
      ];

      classSubjects = [
        { id: 'cs-1', subjectName: 'Mathematics', subjectCode: 'MATH10', sectionName: 'A', courseName: 'Class 10' },
        { id: 'cs-2', subjectName: 'Science', subjectCode: 'SCI09', sectionName: 'B', courseName: 'Class 9' },
      ];
    }

    return NextResponse.json({
      status: 'success',
      assignments,
      classSubjects,
    });
  } catch (error) {
    console.error('Teacher assignments error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Teacher portal access only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, classSubjectId, dueDate, maxMarks, attachmentUrl } = body;

    if (!title || !classSubjectId || !dueDate) {
      return NextResponse.json(
        { status: 'error', message: 'Title, Class-Subject, and Due Date are required.' },
        { status: 400 }
      );
    }

    if (session.tenantId) {
      // Find teacher profile
      const tpRows = await query(
        `SELECT id FROM schoolnext_erp.teacherprofile WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [session.id, session.tenantId]
      );
      if (!tpRows || tpRows.length === 0) {
        return NextResponse.json(
          { status: 'error', message: 'Teacher profile not found for this tenant.' },
          { status: 404 }
        );
      }
      const teacherProfileId = tpRows[0].id;

      // Verify classSubject exists in tenant
      const csRows = await query(
        `SELECT id FROM schoolnext_erp.classsubject WHERE id = ? AND tenantId = ? LIMIT 1`,
        [classSubjectId, session.tenantId]
      );
      if (!csRows || csRows.length === 0) {
        return NextResponse.json(
          { status: 'error', message: 'Selected class subject is invalid or unauthorized.' },
          { status: 400 }
        );
      }

      const generatedId = `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO schoolnext_erp.assignment 
          (id, tenantId, classSubjectId, teacherProfileId, title, description, dueDate, maxMarks, attachmentUrl, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          generatedId,
          session.tenantId,
          classSubjectId,
          teacherProfileId,
          title,
          description || null,
          new Date(dueDate),
          Number(maxMarks || 100),
          attachmentUrl || null,
        ]
      );

      return NextResponse.json({
        status: 'success',
        message: 'Assignment created successfully.',
        assignmentId: generatedId,
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Assignment created successfully (preview mode).',
      assignmentId: `mock_${Date.now()}`,
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
