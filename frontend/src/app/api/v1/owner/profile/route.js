import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Access denied.' }, { status: 403 });
    }

    const tenantId = session.tenantId;

    if (tenantId) {
      const tenant = await queryOne(
        `SELECT id, code, name, type, status, email, phone, address, city, state, postalCode as pincode, website, logoUrl, settings, createdAt 
         FROM schoolnext_erp.tenant 
         WHERE id = ?`,
        [tenantId]
      ).catch((err) => {
        console.error('Tenant profile query error:', err);
        return null;
      });

      if (!tenant) {
        return NextResponse.json({ error: 'Institution not found.' }, { status: 404 });
      }

      let parsedSettings = {};
      if (typeof tenant.settings === 'string') {
        try { parsedSettings = JSON.parse(tenant.settings); } catch {}
      } else if (tenant.settings && typeof tenant.settings === 'object') {
        parsedSettings = tenant.settings;
      }

      return NextResponse.json({
        status: 'success',
        data: {
          ...tenant,
          academicYear: parsedSettings.academicYear || '2026-2027',
        },
      });
    }

    return NextResponse.json({
      status: 'success',
      data: {
        name: 'SchoolNext Platform Administration',
        code: 'PLATFORM',
        type: 'PLATFORM',
        email: session.email,
        academicYear: '2026-2027',
      },
    });
  } catch (error) {
    console.error('Owner profile GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'super_admin' && !session.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized. Access denied.' }, { status: 403 });
    }

    const tenantId = session.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, phone, address, city, state, pincode, website, academicYear } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Institution legal name is required.' }, { status: 400 });
    }

    const existing = await queryOne('SELECT settings FROM schoolnext_erp.tenant WHERE id = ?', [tenantId]).catch(() => null);
    let existingSettings = {};
    if (typeof existing?.settings === 'string') {
      try { existingSettings = JSON.parse(existing.settings); } catch {}
    } else if (existing?.settings && typeof existing.settings === 'object') {
      existingSettings = existing.settings;
    }

    const updatedSettings = {
      ...existingSettings,
      academicYear: academicYear || existingSettings.academicYear || '2026-2027',
    };

    await query(
      `UPDATE schoolnext_erp.tenant 
       SET name = ?, phone = ?, address = ?, city = ?, state = ?, postalCode = ?, website = ?, settings = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        name.trim(),
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        city ? city.trim() : null,
        state ? state.trim() : null,
        pincode ? pincode.trim() : null,
        website ? website.trim() : null,
        JSON.stringify(updatedSettings),
        tenantId,
      ]
    );

    return NextResponse.json({
      status: 'success',
      message: 'Institution profile updated successfully.',
    });
  } catch (error) {
    console.error('Owner profile PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
