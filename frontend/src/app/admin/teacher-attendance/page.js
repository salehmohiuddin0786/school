'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  UserCheck, 
  Clock, 
  Check, 
  X, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Users 
} from 'lucide-react';

export default function TeacherAttendanceAdminPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const loadLeaves = () => {
    setLoading(true);
    fetch('/api/admin/leaves')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setLeaves(d.leaves);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleLeaveAction = async (leaveId, status) => {
    try {
      const res = await fetch('/api/admin/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, status }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActionMessage(`Leave marked as ${status}`);
        setTimeout(() => setActionMessage(''), 3000);
        loadLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Staff Leaves & Approvals
          </h2>
          <p className="text-sm text-slate-500">
            Review faculty leave applications, adjust status, and oversee staff attendance.
          </p>
        </div>

        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Leaves Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Faculty Leave Requests</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {leaves.length} Total Requests
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading leave requests...</div>
          ) : leaves.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No leave requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Faculty Member</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Duration</th>
                    <th className="py-4 px-6">Reason</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {leaves.map((l) => (
                    <tr key={l.s_no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{l.fname} {l.lname}</div>
                        <div className="text-xs text-slate-400">{l.sender_id}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {l.leave_type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <div>{new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}</div>
                        <div className="text-slate-400 font-semibold">{l.leave_days} Day(s)</div>
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
                      <td className="py-4 px-6 text-right space-x-2">
                        {l.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleLeaveAction(l.s_no, 'approved')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveAction(l.s_no, 'rejected')}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {l.status !== 'pending' && (
                          <span className="text-xs text-slate-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
