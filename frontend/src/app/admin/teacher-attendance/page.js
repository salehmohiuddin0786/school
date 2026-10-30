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
  Users,
  Search,
  Save,
  CheckCheck,
  FileText
} from 'lucide-react';

export default function TeacherAttendanceAdminPage() {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'leaves'
  
  // Attendance State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffRecords, setStaffRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceChanges, setAttendanceChanges] = useState({});

  // Leaves State
  const [leaves, setLeaves] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [leavesLoading, setLeavesLoading] = useState(true);

  // Common Feedback
  const [actionMessage, setActionMessage] = useState('');

  // Load Staff Attendance
  const loadStaffAttendance = () => {
    setAttendanceLoading(true);
    fetch(`/api/admin/staff-attendance?date=${date}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setStaffRecords(d.records || []);
          setSummary(d.summary || {});
          // Initialize local changes
          const map = {};
          (d.records || []).forEach(r => {
            map[r.teacher_id] = r.status;
          });
          setAttendanceChanges(map);
        }
        setAttendanceLoading(false);
      })
      .catch(() => setAttendanceLoading(false));
  };

  // Load Leaves
  const loadLeaves = () => {
    setLeavesLoading(true);
    fetch('/api/admin/leaves')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setLeaves(d.leaves || []);
        setLeavesLoading(false);
      })
      .catch(() => setLeavesLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadStaffAttendance();
    } else {
      loadLeaves();
    }
  }, [activeTab, date]);

  // Handle single staff status change
  const handleStatusChange = (teacherId, newStatus) => {
    setAttendanceChanges(prev => ({
      ...prev,
      [teacherId]: newStatus,
    }));
  };

  // Quick action: Mark all unassigned as PRESENT
  const markAllPresent = () => {
    const updated = { ...attendanceChanges };
    staffRecords.forEach(r => {
      updated[r.teacher_id] = 'PRESENT';
    });
    setAttendanceChanges(updated);
  };

  // Save Daily Staff Attendance
  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const list = Object.entries(attendanceChanges).map(([teacher_id, status]) => ({
        teacher_id,
        status: status === 'NOT_MARKED' ? 'PRESENT' : status,
      }));

      const res = await fetch('/api/admin/staff-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, attendanceList: list }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to record attendance');
      }

      setActionMessage(`Attendance for ${date} saved successfully!`);
      setTimeout(() => setActionMessage(''), 3000);
      loadStaffAttendance();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Handle Leave Action
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

  const filteredLeaves = leaves.filter(l => {
    if (leaveFilter === 'all') return true;
    return String(l.status).toLowerCase() === leaveFilter.toLowerCase();
  });

  const statuses = [
    { key: 'PRESENT', label: 'Present', color: 'bg-emerald-600 text-white' },
    { key: 'ABSENT', label: 'Absent', color: 'bg-rose-600 text-white' },
    { key: 'HALF_DAY', label: 'Half Day', color: 'bg-amber-600 text-white' },
    { key: 'LATE', label: 'Late', color: 'bg-purple-600 text-white' },
    { key: 'PAID_LEAVE', label: 'Paid Leave', color: 'bg-blue-600 text-white' },
    { key: 'UNPAID_LEAVE', label: 'Unpaid Leave', color: 'bg-slate-600 text-white' },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Staff Attendance & Teacher Leave Management
            </h2>
            <p className="text-sm text-slate-500">
              Record daily teacher roll call, view monthly summaries, and process leave requests.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Daily Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaves'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Leave Applications</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* ===================== TAB 1: DAILY STAFF ATTENDANCE ===================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Date Picker & Summary Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Roll Call Date</label>
                  <input
                    type="date"
                    value={date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                  Present: {summary.PRESENT || 0}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-100">
                  Absent: {summary.ABSENT || 0}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-100">
                  Half Day: {summary.HALF_DAY || 0}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-100">
                  Late: {summary.LATE || 0}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-100">
                  Leave: {(summary.PAID_LEAVE || 0) + (summary.UNPAID_LEAVE || 0)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllPresent}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mark All Present</span>
                </button>
                <button
                  type="button"
                  disabled={savingAttendance}
                  onClick={handleSaveAttendance}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-60 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingAttendance ? 'Saving...' : 'Save Attendance'}</span>
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {attendanceLoading ? (
                <div className="py-20 text-center text-sm text-slate-400">Loading staff records...</div>
              ) : staffRecords.length === 0 ? (
                <div className="py-20 text-center text-sm text-slate-400">No faculty members found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                        <th className="py-4 px-6">Faculty Member</th>
                        <th className="py-4 px-6">Subject / Role</th>
                        <th className="py-4 px-6">Status on {date}</th>
                        <th className="py-4 px-6 text-right">Attendance Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {staffRecords.map((t) => {
                        const currentStatus = attendanceChanges[t.teacher_id] || t.status;
                        return (
                          <tr key={t.teacher_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900">{t.fname} {t.lname}</div>
                              <div className="text-xs text-slate-400 font-mono">{t.teacher_id}</div>
                            </td>
                            <td className="py-4 px-6 text-slate-600 font-semibold">
                              {t.subject || 'Faculty'}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : currentStatus === 'ABSENT'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : currentStatus === 'HALF_DAY'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : currentStatus === 'LATE'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : currentStatus === 'PAID_LEAVE'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : currentStatus === 'UNPAID_LEAVE'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {currentStatus.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex flex-wrap gap-1 justify-end">
                                {statuses.map((s) => (
                                  <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => handleStatusChange(t.teacher_id, s.key)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                      currentStatus === s.key
                                        ? s.color + ' shadow-sm scale-105'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: TEACHER LEAVE REQUESTS ===================== */}
        {activeTab === 'leaves' && (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2">
                {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setLeaveFilter(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      leaveFilter === tab
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab} ({leaves.filter(l => tab === 'all' || String(l.status).toLowerCase() === tab).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Leaves Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {leavesLoading ? (
                <div className="py-20 text-center text-sm text-slate-400">Loading leave applications...</div>
              ) : filteredLeaves.length === 0 ? (
                <div className="py-20 text-center text-sm text-slate-400">No {leaveFilter} leave applications found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                        <th className="py-4 px-6">Faculty Member</th>
                        <th className="py-4 px-6">Leave Type</th>
                        <th className="py-4 px-6">Duration</th>
                        <th className="py-4 px-6">Reason</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredLeaves.map((l) => (
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
                            {l.status === 'pending' ? (
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
                            ) : (
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
        )}

      </div>
    </DashboardLayout>
  );
}
