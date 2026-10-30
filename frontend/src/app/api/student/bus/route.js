import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'student' && session.role !== 'parent')) {
      return NextResponse.json({ error: 'Unauthorized. Student or parent access only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetStudentId = (session.role === 'parent' && searchParams.get('studentId')) ? searchParams.get('studentId') : session.id;

    // 1. Check canonical schoolnext_erp if tenantId exists
    if (session.tenantId) {
      const studentRec = await queryOne(
        `SELECT s.id, s.admissionNumber, u.firstName, u.lastName 
         FROM schoolnext_erp.student s 
         JOIN schoolnext_erp.user u ON s.userId = u.id 
         WHERE s.tenantId = ? AND (s.userId = ? OR s.id = ? OR u.email = ?) LIMIT 1`,
        [session.tenantId, targetStudentId, targetStudentId, session.email]
      ).catch(() => null);

      // Check vehicle and transportroute
      const vehicleRows = await query(
        `SELECT v.id, v.registrationNumber, v.model, v.driverName, v.driverPhone, tr.routeName, tr.stops, tr.fare
         FROM schoolnext_erp.vehicle v
         JOIN schoolnext_erp.transportroute tr ON v.routeId = tr.id
         WHERE v.tenantId = ? LIMIT 1`,
        [session.tenantId]
      ).catch(() => []);

      if (vehicleRows.length > 0) {
        const v = vehicleRows[0];
        let parsedStops = [];
        try {
          parsedStops = typeof v.stops === 'string' ? JSON.parse(v.stops) : (v.stops || []);
        } catch {
          parsedStops = [];
        }

        return NextResponse.json({
          status: 'success',
          assigned: true,
          bus: {
            bus_id: v.id,
            bus_title: v.routeName || 'Campus Shuttle',
            bus_number: v.registrationNumber,
            driver: {
              name: v.driverName || 'Designated Driver',
              contact: v.driverPhone || '9876543210',
            },
            stops: parsedStops.map((st, i) => ({
              s_no: i + 1,
              location: st.location || st.stopName || `Stop ${i + 1}`,
              arrival_time: st.arrival_time || st.time || '07:30 AM',
            })),
          },
        });
      }
    }

    // 2. Query legacy database
    const student = await queryOne(
      'SELECT bus_id, fname, lname FROM students WHERE id = ? OR email = ? LIMIT 1',
      [targetStudentId, session.email]
    ).catch(() => null);

    if (!student || !student.bus_id) {
      return NextResponse.json({
        status: 'success',
        assigned: false,
        bus: null,
        message: 'No bus assigned to your student profile.',
      });
    }

    const bus = await queryOne('SELECT s_no, bus_id, bus_title, bus_number FROM buses WHERE bus_id = ?', [student.bus_id]).catch(() => null);
    if (!bus) {
      return NextResponse.json({
        status: 'success',
        assigned: false,
        bus: null,
        message: 'Assigned bus details not found in transit registry.',
      });
    }

    // Get driver details
    const driver = await queryOne(
      'SELECT name, contact, role FROM bus_staff WHERE bus_id = ? AND (role = "driver" OR role = "DRIVER") LIMIT 1',
      [student.bus_id]
    ).catch(() => null);

    // Get stops
    const stops = await query(
      'SELECT s_no, location, arrival_time, serial FROM bus_root WHERE bus_id = ? ORDER BY serial ASC',
      [student.bus_id]
    ).catch(() => []);

    return NextResponse.json({
      status: 'success',
      assigned: true,
      bus: {
        bus_id: bus.bus_id,
        bus_title: bus.bus_title,
        bus_number: bus.bus_number,
        driver: {
          name: driver?.name || 'Assigned Transit Driver',
          contact: driver?.contact || '+91 98230 45678',
        },
        stops: stops || [],
      },
    });
  } catch (error) {
    console.error('Student bus API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
