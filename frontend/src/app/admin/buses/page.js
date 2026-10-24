'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Bus, 
  MapPin, 
  Plus, 
  X, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

export default function BusesAdminPage() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busTitle, setBusTitle] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [stops, setStops] = useState([{ location: '', arrival_time: '' }]);
  const [message, setMessage] = useState('');

  const loadBuses = () => {
    setLoading(true);
    fetch('/api/admin/buses')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setBuses(d.buses);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadBuses();
  }, []);

  const addStopRow = () => {
    setStops([...stops, { location: '', arrival_time: '' }]);
  };

  const handleStopChange = (index, field, value) => {
    const updated = [...stops];
    updated[index][field] = value;
    setStops(updated);
  };

  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_title: busTitle,
          bus_number: busNumber,
          stops: stops.filter(s => s.location.trim() !== ''),
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Bus and route created successfully!');
        setTimeout(() => setMessage(''), 3000);
        setModalOpen(false);
        setBusTitle('');
        setBusNumber('');
        setStops([{ location: '', arrival_time: '' }]);
        loadBuses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Transport & Bus Routes</h2>
            <p className="text-sm text-slate-500">Manage school buses, drivers, transit stops and arrival schedules.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-amber-600/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle / Route</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Bus Fleet Cards */}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            Loading transport fleet...
          </div>
        ) : buses.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            No buses or routes registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((b) => (
              <div key={b.s_no} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Bus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {b.bus_number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">{b.bus_title}</h3>
                  <div className="text-xs font-mono text-indigo-600 mb-4 font-semibold">{b.bus_id}</div>

                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Route Stops ({b.stops?.length || 0})
                    </span>
                    {b.stops && b.stops.length > 0 ? (
                      b.stops.map((st, i) => (
                        <div key={st.s_no || i} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-semibold">{st.location}</span>
                          </div>
                          <span className="text-slate-400 font-mono">{st.arrival_time || '—'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">No designated stops.</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Operational
                  </span>
                  <span className="text-slate-400">Standard Fleet</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Bus */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Add Vehicle & Stops</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBus} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Route / Bus Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Campus Route 1"
                    value={busTitle}
                    onChange={e => setBusTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Bus Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-01-AB-1234"
                    value={busNumber}
                    onChange={e => setBusNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-600"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Stops & Arrival Timings</label>
                    <button
                      type="button"
                      onClick={addStopRow}
                      className="text-xs text-amber-600 font-bold hover:underline"
                    >
                      + Add Stop
                    </button>
                  </div>
                  {stops.map((s, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Stop location"
                        value={s.location}
                        onChange={e => handleStopChange(idx, 'location', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="07:30 AM"
                        value={s.arrival_time}
                        onChange={e => handleStopChange(idx, 'arrival_time', e.target.value)}
                        className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold">Register Bus</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
