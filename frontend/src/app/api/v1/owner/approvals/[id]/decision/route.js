import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ensureCapexTable } from '../../pending/route';

const VALID_OWNER_PINS = new Set(['1234', '0000', '9999']);

export async function POST(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const approvalId = resolvedParams?.id;

    if (!approvalId) {
      return NextResponse.json({ error: 'Requisition ID is required.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { status, notes, authPin } = body;

    // Validate Status
    const normalizedStatus = String(status || '').toUpperCase();
    if (normalizedStatus !== 'APPROVED' && normalizedStatus !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Invalid status. Status must be either "APPROVED" or "REJECTED".' },
        { status: 400 }
      );
    }

    // Validate Auth PIN
    if (!authPin || !VALID_OWNER_PINS.has(String(authPin).trim())) {
      return NextResponse.json(
        { error: 'Invalid Authorization PIN. Owner digital signature verification failed.' },
        { status: 401 }
      );
    }

    await ensureCapexTable();

    // Check requisition in DB
    const requisition = await queryOne(
      'SELECT * FROM capex_approvals WHERE id = ? LIMIT 1',
      [approvalId]
    ).catch(() => null);

    if (!requisition) {
      return NextResponse.json(
        { error: `Capex requisition with ID '${approvalId}' not found.` },
        { status: 404 }
      );
    }

    const decisionNotes = notes || (normalizedStatus === 'APPROVED' ? 'Approved for execution.' : 'Rejected by Owner.');
    const decidedBy = session.name || session.email || 'Executive Owner';

    await query(`
      UPDATE capex_approvals 
      SET status = ?, decision_notes = ?, decided_at = NOW(), decided_by = ?
      WHERE id = ?
    `, [normalizedStatus, decisionNotes, decidedBy, approvalId]);

    const updated = await queryOne(
      'SELECT id, title, department, vendor, amount, category, status, decision_notes, decided_at, decided_by FROM capex_approvals WHERE id = ?',
      [approvalId]
    );

    return NextResponse.json({
      status: 'success',
      message: `Requisition ${approvalId} has been successfully ${normalizedStatus}.`,
      approval: {
        id: updated?.id || approvalId,
        title: updated?.title || requisition.title,
        amount: Number(updated?.amount || requisition.amount),
        status: updated?.status || normalizedStatus,
        notes: updated?.decision_notes || decisionNotes,
        decidedAt: updated?.decided_at instanceof Date ? updated.decided_at.toISOString() : updated?.decided_at,
        decidedBy: updated?.decided_by || decidedBy,
      },
    });
  } catch (error) {
    console.error('Owner capex decision API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
