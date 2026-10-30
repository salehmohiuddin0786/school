import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

let tableChecked = false;
async function ensureBusesTable() {
  if (tableChecked) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS buses (
        s_no int NOT NULL AUTO_INCREMENT,
        bus_id varchar(20) NOT NULL,
        bus_title varchar(255) NOT NULL,
        bus_number varchar(20) NOT NULL,
        request varchar(11) NOT NULL DEFAULT 'active',
        PRIMARY KEY (s_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS bus_root (
        s_no int NOT NULL AUTO_INCREMENT,
        bus_id varchar(20) NOT NULL,
        location varchar(255) NOT NULL,
        arrival_time varchar(20) NOT NULL DEFAULT '',
        serial int NOT NULL DEFAULT 1,
        PRIMARY KEY (s_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tableChecked = true;
  } catch (err) {
    console.warn('ensureBusesTable warning:', err.message);
  }
}

export async function GET() {
  try {
    await ensureBusesTable();
    let buses = [];
    let routes = [];

    try {
      const busRows = await query('SELECT * FROM buses ORDER BY s_no DESC');
      if (Array.isArray(busRows)) buses = busRows;
    } catch (e) {
      console.warn('Buses query fallback:', e.message);
    }

    try {
      const routeRows = await query('SELECT * FROM bus_root ORDER BY bus_id ASC, serial ASC');
      if (Array.isArray(routeRows)) routes = routeRows;
    } catch (e) {
      console.warn('Routes query fallback:', e.message);
    }

    const busesWithRoutes = buses.map(bus => ({
      ...bus,
      stops: routes.filter(r => r.bus_id === bus.bus_id),
    }));

    return NextResponse.json({ status: 'success', buses: busesWithRoutes });
  } catch (error) {
    return NextResponse.json({ error: error.message, buses: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureBusesTable();
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { bus_title, bus_number, stops } = body;

    if (!bus_title || !bus_number) {
      return NextResponse.json({ error: 'Bus title and number are required' }, { status: 400 });
    }

    const busId = 'BUS' + Date.now().toString().slice(-6);

    await query(
      'INSERT INTO buses (bus_id, bus_title, bus_number, request) VALUES (?, ?, ?, ?)',
      [busId, bus_title, bus_number, 'active']
    );

    if (stops && Array.isArray(stops)) {
      for (let i = 0; i < stops.length; i++) {
        await query(
          'INSERT INTO bus_root (bus_id, location, arrival_time, serial) VALUES (?, ?, ?, ?)',
          [busId, stops[i].location, stops[i].arrival_time || '', i + 1]
        );
      }
    }

    return NextResponse.json({ status: 'success', message: 'Bus created successfully', busId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await ensureBusesTable();
    const session = await getSessionUser();
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const busId = searchParams.get('bus_id') || searchParams.get('id');
    if (!busId) {
      return NextResponse.json({ error: 'bus_id is required' }, { status: 400 });
    }

    await query('DELETE FROM buses WHERE bus_id = ? OR s_no = ?', [busId, busId]);
    await query('DELETE FROM bus_root WHERE bus_id = ?', [busId]);

    return NextResponse.json({ status: 'success', message: 'Bus deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
