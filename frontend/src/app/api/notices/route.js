import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized.' }, { status: 401 });
    }

    const roleAudienceMap = {
      super_admin: 'ALL',
      admin: 'STAFF',
      owner: 'ALL',
      teacher: 'TEACHERS',
      student: 'STUDENTS',
      parent: 'PARENTS',
    };

    const targetAudience = roleAudienceMap[session.role] || 'ALL';
    let notices = [];

    if (session.tenantId) {
      const rows = await query(
        `SELECT 
          n.id,
          n.title,
          n.content,
          n.targetAudience,
          CASE WHEN n.isUrgent = 1 THEN 'URGENT' ELSE 'NORMAL' END as priority,
          n.createdAt as publishedAt,
          n.expiresAt,
          u.firstName as authorFname,
          u.lastName as authorLname
        FROM schoolnext_erp.notice n
        LEFT JOIN schoolnext_erp.user u ON n.publishedById = u.id
        WHERE n.tenantId = ? 
          AND (n.expiresAt IS NULL OR n.expiresAt >= NOW())
          AND (n.targetAudience = 'ALL' OR n.targetAudience = ? OR n.targetAudience = 'STAFF')
        ORDER BY n.createdAt DESC LIMIT 50`,
        [session.tenantId, targetAudience]
      );

      notices = rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        audience: r.targetAudience,
        priority: r.priority,
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : 'Recent',
        attachmentUrl: null,
        author: r.authorFname ? `${r.authorFname} ${r.authorLname || ''}`.trim() : 'Administration',
      }));
    } else {
      const legacyRows = await query(
        `SELECT s_no as id, title, body as content, importance as priority, timestamp as publishedAt 
         FROM notice 
         WHERE role = 'all' OR role = ? 
         ORDER BY s_no DESC LIMIT 30`,
        [session.role]
      );

      notices = legacyRows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        audience: 'ALL',
        priority: r.priority || 'NORMAL',
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : 'Recent',
        attachmentUrl: null,
        author: 'School Administration',
      }));
    }

    return NextResponse.json({ status: 'success', notices });
  } catch (error) {
    console.error('Notices API error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
