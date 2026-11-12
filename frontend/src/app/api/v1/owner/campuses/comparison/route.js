import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
    }

    const tenantId = session.tenantId;

    let campusRows = [];
    if (tenantId) {
      campusRows = await query(`
        SELECT id, code, name, isMain, address, phone, email 
        FROM schoolnext_erp.campus 
        WHERE tenantId = ? AND isActive = 1 
        ORDER BY isMain DESC, name ASC
      `, [tenantId]).catch(() => []);
    } else {
      campusRows = await query(`
        SELECT id, code, name, isMain, address, phone, email 
        FROM schoolnext_erp.campus 
        WHERE isActive = 1 
        ORDER BY isMain DESC, name ASC
        LIMIT 10
      `).catch(() => []);
    }

    const benchmarks = await Promise.all(
      campusRows.map(async (c) => {
        const isMainCampus = Boolean(c.isMain);

        const [studentRes, staffRes, feeRes] = await Promise.all([
          queryOne(
            `SELECT COUNT(*) as count FROM schoolnext_erp.student WHERE campusId = ? ${tenantId ? 'AND tenantId = ?' : ''}`,
            tenantId ? [c.id, tenantId] : [c.id]
          ).catch(() => ({ count: 0 })),
          queryOne(
            `SELECT COUNT(*) as count FROM schoolnext_erp.staffprofile WHERE campusId = ? ${tenantId ? 'AND tenantId = ?' : ''}`,
            tenantId ? [c.id, tenantId] : [c.id]
          ).catch(() => ({ count: 0 })),
          queryOne(
            `SELECT 
               COALESCE(SUM(paidAmount), 0) as paid,
               COALESCE(SUM(totalAmount), 0) as billed
             FROM schoolnext_erp.invoice 
             WHERE campusId = ? ${tenantId ? 'AND tenantId = ?' : ''}`,
            tenantId ? [c.id, tenantId] : [c.id]
          ).catch(() => ({ paid: 0, billed: 0 })),
        ]);

        const totalStudents = Number(studentRes?.count || 0);
        const staffCount = Number(staffRes?.count || 0);
        const collectionsYtd = Number(feeRes?.paid || 0);
        const collectionTarget = Number(feeRes?.billed || 0);
        const capacity = isMainCampus ? 1000 : 500;
        const occupancyRate = Number(((totalStudents / capacity) * 100).toFixed(2));
        const collectionEfficiency = collectionTarget > 0 
          ? Number(((collectionsYtd / collectionTarget) * 100).toFixed(2)) 
          : 0;
        const teacherStudentRatio = staffCount > 0 
          ? `1:${Math.max(1, Math.round(totalStudents / staffCount))}` 
          : '1:0';
        const averageFeePerStudent = totalStudents > 0 
          ? Math.round(collectionsYtd / totalStudents) 
          : 0;

        return {
          campusId: c.id,
          campusCode: c.code || (isMainCampus ? 'MAIN' : 'BRANCH'),
          campusName: c.name,
          isMain: isMainCampus,
          totalStudents,
          capacity,
          occupancyRate,
          staffCount,
          teacherStudentRatio,
          collectionsYtd,
          collectionTarget,
          collectionEfficiency,
          studentGrowthYoY: 0,
          averageFeePerStudent,
          address: c.address || 'Campus facility location',
          phone: c.phone || 'N/A',
        };
      })
    );

    return NextResponse.json(benchmarks);
  } catch (error) {
    console.error('Campuses comparison API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
