'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Bus, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Phone 
} from 'lucide-react';

export default function StudentBusPage() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/buses')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setBuses(d.buses || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Bus & Route Tracking</h2>
          <p className="text-sm text-slate-500">Check morning pickup and afternoon drop-off bus schedules.</p>
        </div>

        {/* Bus Cards */}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            Loading bus routes...
          </div>
        ) : buses.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            No transit routes configured.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {buses.map((b) => (
              <div key={b.s_no} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Bus className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{b.bus_title}</h3>
                        <span className="text-xs font-mono font-bold text-indigo-600">{b.bus_number}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Route
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Designated Stops & Expected Timings
                    </span>
                    {b.stops && b.stops.length > 0 ? (
                      <div className="relative pl-6 border-l-2 border-amber-300 space-y-4 my-2">
                        {b.stops.map((st, i) => (
                          <div key={st.s_no || i} className="relative">
                            <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                            <div className="font-bold text-sm text-slate-800">{st.location}</div>
                            <div className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {st.arrival_time || 'Scheduled Arrival'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">No intermediate stops specified.</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>Student Safety Certified</span>
                  <span className="font-semibold text-amber-700">Campus Transport Desk</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
