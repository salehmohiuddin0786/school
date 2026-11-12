import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Platform Owner access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const targetEmail = body.email;

    const tenant = await queryOne('SELECT id, name FROM schoolnext_erp.tenant WHERE id = ?', [id]).catch(() => null);
    if (!tenant) {
      return NextResponse.json({ error: `Institution with ID '${id}' not found.` }, { status: 404 });
    }

    let ownerUser = null;
    if (targetEmail) {
      ownerUser = await queryOne('SELECT id, email, firstName, lastName FROM schoolnext_erp.user WHERE tenantId = ? AND email = ?', [id, targetEmail.toLowerCase().trim()]).catch(() => null);
    } else {
      ownerUser = await queryOne(`
        SELECT u.id, u.email, u.firstName, u.lastName 
        FROM schoolnext_erp.user u
        JOIN schoolnext_erp.userrole ur ON u.id = ur.userId
        JOIN schoolnext_erp.role r ON ur.roleId = r.id
        WHERE u.tenantId = ? AND r.code IN ('OWNER', 'SCHOOL_ADMIN', 'COLLEGE_ADMIN')
        LIMIT 1
      `, [id]).catch(() => null);
    }

    const emailToSend = ownerUser?.email || targetEmail;
    if (!emailToSend) {
      return NextResponse.json({ error: 'No owner email associated with this institution.' }, { status: 400 });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(`
      INSERT INTO schoolnext_erp.invitation (
        id, tenantId, email, role, token, status, expiresAt, createdAt
      ) VALUES (?, ?, ?, 'OWNER', ?, 'PENDING', ?, NOW())
    `, [
      crypto.randomUUID(),
      id,
      emailToSend.toLowerCase().trim(),
      inviteToken,
      expiresAt,
    ]);

    // Audit log
    await query(`
      INSERT INTO schoolnext_erp.auditlog (
        id, tenantId, userId, action, entityType, entityId, newValues, createdAt
      ) VALUES (?, ?, ?, 'INVITATION_SENT', 'USER', ?, ?, NOW())
    `, [
      crypto.randomUUID(),
      id,
      session.id,
      ownerUser?.id || id,
      JSON.stringify({ email: emailToSend, expiresAt }),
    ]).catch(() => {});

    return NextResponse.json({
      status: 'success',
      message: `Account activation link generated and dispatched for '${emailToSend}'.`,
      invitation: {
        email: emailToSend,
        token: inviteToken,
        activationUrl: `/activate?token=${inviteToken}`,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Invite owner API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
