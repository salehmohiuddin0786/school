import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const buses = await query('SELECT * FROM buses ORDER BY s_no DESC');
    const routes = await query('SELECT * FROM bus_root ORDER BY bus_id ASC, serial ASC');

    const busesWithRoutes = buses.map(bus => ({
      ...bus,
      stops: routes.filter(r => r.bus_id === bus.bus_id),
    }));

    return NextResponse.json({ status: 'success', buses: busesWithRoutes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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
