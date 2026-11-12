import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function ensureCapexTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS capex_approvals (
      id VARCHAR(64) PRIMARY KEY,
      tenant_id VARCHAR(64) NOT NULL DEFAULT 'a30ecf76-6525-407b-b180-bd9b681799f1',
      title VARCHAR(255) NOT NULL,
      department VARCHAR(128) NOT NULL,
      requested_by VARCHAR(128) NOT NULL,
      vendor VARCHAR(255) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      category VARCHAR(64) NOT NULL,
      priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
      justification TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      decision_notes TEXT,
      decided_at DATETIME NULL,
      decided_by VARCHAR(128) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `).catch(() => {});
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    await ensureCapexTable();

    const tenantId = session.tenantId;

    let rows = [];
    if (tenantId) {
      rows = await query(`
        SELECT 
          id,
          title,
          department,
          requested_by as requestedBy,
          vendor,
          amount,
          category,
          priority,
          justification,
          submitted_at as submittedAt,
          status
        FROM capex_approvals
        WHERE status = 'PENDING' AND tenant_id = ?
        ORDER BY amount DESC
      `, [tenantId]).catch(() => []);
    } else {
      rows = await query(`
        SELECT 
          id,
          title,
          department,
          requested_by as requestedBy,
          vendor,
          amount,
          category,
          priority,
          justification,
          submitted_at as submittedAt,
          status
        FROM capex_approvals
        WHERE status = 'PENDING'
        ORDER BY amount DESC
      `).catch(() => []);
    }

    const formattedApprovals = rows.map((r) => ({
      id: r.id,
      title: r.title,
      department: r.department,
      requestedBy: r.requestedBy,
      vendor: r.vendor,
      amount: Number(r.amount),
      category: r.category,
      priority: r.priority,
      justification: r.justification,
      submittedAt: r.submittedAt instanceof Date ? r.submittedAt.toISOString() : r.submittedAt,
      status: r.status,
    }));

    return NextResponse.json(formattedApprovals);
  } catch (error) {
    console.error('Pending capex approvals API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
