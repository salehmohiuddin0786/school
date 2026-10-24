'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Clock, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  X, 
  AlertCircle 
} from 'lucide-react';

export default function TeacherLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    leave_type: 'Casual Leave',
    leave_desc: '',
    start_date: '2026-10-16',
    end_date: '2026-10-16',
    leave_days: 1,
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setForm(f => ({ ...f, start_date: today, end_date: today }));
  }, []);

  const loadLeaves = () => {
    setLoading(true);
    fetch('/api/teacher/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setLeaves(d.myLeaves || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teacher/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Leave request submitted to administration!');
        setTimeout(() => setMessage(''), 3000);
        setModalOpen(false);
        setForm({
          leave_type: 'Casual Leave',
          leave_desc: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          leave_days: 1,
        });
        loadLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leave Applications</h2>
            <p className="text-sm text-slate-500">Submit requests for authorized leave and check approval status.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Leaves Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading leave history...</div>
          ) : leaves.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No leave applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Leave Type</th>
                    <th className="py-4 px-6">Duration</th>
                    <th className="py-4 px-6">Days</th>
                    <th className="py-4 px-6">Reason / Notes</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6">Submitted On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {leaves.map((l) => (
                    <tr key={l.s_no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {l.leave_type}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {new Date(l.start_date).toLocaleDateString()} &rarr; {new Date(l.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {l.leave_days}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                        {l.leave_desc}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          l.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : l.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(l.send_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Apply Leave */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Apply for Leave</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Leave Category</label>
                  <select
                    value={form.leave_type}
                    onChange={e => setForm({ ...form, leave_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Maternity/Paternity">Maternity/Paternity Leave</option>
                    <option value="Special Duty">Special Duty</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={form.start_date}
                      onChange={e => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={form.end_date}
                      onChange={e => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Days</label>
                  <input
                    type="number"
                    min="1"
                    value={form.leave_days}
                    onChange={e => setForm({ ...form, leave_days: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reason for Leave *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide reason for absence..."
                    value={form.leave_desc}
                    onChange={e => setForm({ ...form, leave_desc: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Submit Application</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
