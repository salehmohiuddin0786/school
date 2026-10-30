'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Bus, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Phone, 
  User, 
  AlertCircle,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function StudentBusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/bus')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const bus = data?.bus;
  const isAssigned = data?.assigned && Boolean(bus);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assigned Bus & Transit Route</h2>
          <p className="text-sm text-slate-500">View your designated campus transport vehicle, allocated driver, and pickup stops.</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            Checking student transit registration...
          </div>
        ) : !isAssigned ? (
          /* CLEAR EMPTY STATE WHEN NO BUS ASSIGNED */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4">
              <Bus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Bus Route Assigned</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              You are currently registered as a day scholar / self-commuter. No school transit vehicle is assigned to your profile.
            </p>
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 max-w-md mx-auto text-xs text-slate-600 text-left space-y-1">
              <span className="font-bold text-slate-800 block">Need Campus Transport?</span>
              <div>Contact the Transport Desk at <strong>transport@schoolnext.internal</strong> or visit the Administration office.</div>
            </div>
          </div>
        ) : (
          /* ASSIGNED BUS DETAILS */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                    <Bus className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Your Assigned Vehicle</span>
                    <h3 className="text-xl font-extrabold text-slate-900">{bus.bus_title}</h3>
                    <span className="text-xs font-mono font-bold text-indigo-600">Plate Number: {bus.bus_number}</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Active & Verified Route</span>
                </span>
              </div>

              {/* Driver & Transit Desk Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Designated Driver
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{bus.driver?.name || 'School Driver'}</div>
                      <div className="text-xs text-slate-500">Campus Transit Operator</div>
                    </div>
                    {bus.driver?.contact && (
                      <a
                        href={`tel:${bus.driver.contact}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 text-xs font-bold shadow-sm transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{bus.driver.contact}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Transport Safety Helpline
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Control Desk</div>
                      <div className="text-xs text-slate-500">Available 06:00 AM - 07:00 PM</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 px-3 py-2 bg-white rounded-xl border border-slate-200">
                      +91 8080808080
                    </span>
                  </div>
                </div>
              </div>

              {/* Designated Route Stops */}
              <div className="pt-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">
                  Pickup & Drop-off Route Itinerary
                </span>

                {bus.stops && bus.stops.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-amber-300 space-y-6 my-2">
                    {bus.stops.map((st, i) => (
                      <div key={st.s_no || i} className="relative">
                        <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{st.location}</span>
                            {i === 0 && <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">Origin</span>}
                            {i === bus.stops.length - 1 && <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Destination</span>}
                          </div>
                          <div className="text-xs text-indigo-600 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{st.arrival_time || 'Scheduled Arrival'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No intermediate stops recorded for this route.</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
