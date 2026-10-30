import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized. Admin access only.' }, { status: 403 });
    }

    const { id } = await params;

    if (session.tenantId) {
      const res = await query(
        `UPDATE schoolnext_erp.teachersubstitution
         SET status = 'CANCELLED', updatedAt = NOW()
         WHERE id = ? AND tenantId = ?`,
        [id, session.tenantId]
      );
      if (res.affectedRows === 0) {
        return NextResponse.json({ status: 'error', message: 'Substitution record not found.' }, { status: 404 });
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Substitution cancelled successfully. Original teacher schedule restored.',
    });
  } catch (error) {
    console.error('Cancel substitution error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
