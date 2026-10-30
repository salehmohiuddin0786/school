'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  UserCheck, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Trash2, 
  RefreshCw, 
  Search,
  BookOpen,
  MapPin,
  ShieldCheck
} from 'lucide-react';

export default function AdminSubstitutionsPage() {
  const [substitutions, setSubstitutions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  // Form states
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [selectedSubTeacherId, setSelectedSubTeacherId] = useState('');
  const [subDate, setSubDate] = useState(new Date().toISOString().split('T')[0]);
  const [subReason, setSubReason] = useState('LEAVE');
  const [subNotes, setSubNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSubstitutions();
  }, [filterDate]);

  const fetchSubstitutions = async () => {
    try {
      setLoading(true);
      const url = filterDate 
        ? `/api/admin/substitutions?date=${filterDate}` 
        : `/api/admin/substitutions`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'success') {
        setSubstitutions(data.substitutions || []);
        setTeachers(data.teachers || []);
        setTimetableEntries(data.timetableEntries || []);
        if (data.timetableEntries?.length > 0 && !selectedEntryId) {
          setSelectedEntryId(data.timetableEntries[0].id);
        }
        if (data.teachers?.length > 0 && !selectedSubTeacherId) {
          setSelectedSubTeacherId(data.teachers[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubstitution = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!selectedEntryId || !selectedSubTeacherId || !subDate) {
      setFormError('Please select class period, substitute teacher, and target date.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/substitutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableEntryId: selectedEntryId,
          substituteTeacherId: selectedSubTeacherId,
          date: subDate,
          reason: subReason,
          notes: subNotes,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg(data.message || 'Substitution assigned successfully!');
        setShowModal(false);
        setSubNotes('');
        fetchSubstitutions();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setFormError(data.message || 'Failed to assign substitute.');
      }
    } catch (err) {
      setFormError('Network error while assigning substitute.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubstitution = async (subId) => {
    if (!confirm('Are you sure you want to cancel this substitution and restore the original teacher?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/substitutions/${subId}/cancel`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('Substitution cancelled and original schedule restored.');
        fetchSubstitutions();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Teacher Substitution Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Automated conflict checks, period coverages, temporary roll call authorization, and schedule synchronization.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Substitute Teacher</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 outline-none"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Clear Date
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-slate-400">
            {substitutions.length} Recorded Assignments
          </span>
        </div>

        {/* Substitutions Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading substitutions...</span>
            </div>
          ) : substitutions.length === 0 ? (
            <div className="py-20 text-center">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No substitutions recorded</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No active or historical teacher substitution entries found for the selected period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Period & Time</th>
                    <th className="py-3.5 px-5">Class & Subject</th>
                    <th className="py-3.5 px-5">Original Faculty</th>
                    <th className="py-3.5 px-5 text-emerald-700">Designated Substitute</th>
                    <th className="py-3.5 px-5">Reason</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {substitutions.map((sub) => {
                    const isActive = sub.status === 'ACTIVE';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {sub.date}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-800">Period {sub.periodNumber}</span>
                          <div className="text-[11px] text-slate-400">{sub.time}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900">{sub.courseName}</div>
                          <div className="text-[11px] text-slate-500">Section {sub.sectionName} ({sub.room})</div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-700">
                          {sub.originalTeacher}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-emerald-700">
                          {sub.substituteTeacher}
                        </td>
                        <td className="py-3.5 px-5 text-slate-500">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {sub.reason}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {isActive && (
                            <button
                              onClick={() => handleCancelSubstitution(sub.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assign Substitute Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Assign Substitute Faculty</h2>
                  <p className="text-xs text-slate-500">Automated timetable conflict validation & roll call delegation</p>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubstitution} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Date *</label>
                  <input
                    type="date"
                    required
                    value={subDate}
                    onChange={(e) => setSubDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Timetable Period Slot *</label>
                  <select
                    value={selectedEntryId}
                    onChange={(e) => setSelectedEntryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {timetableEntries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.dayOfWeek} P{e.periodNumber} ({e.time}) &bull; {e.courseName} ({e.sectionName}) &bull; Current: {e.currentTeacher}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Substitute Teacher *</label>
                  <select
                    value={selectedSubTeacherId}
                    onChange={(e) => setSelectedSubTeacherId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code || 'Faculty'})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    System verifies substitute's availability and rejects overlapping class assignments.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Absence Reason</label>
                  <select
                    value={subReason}
                    onChange={(e) => setSubReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="LEAVE">Approved Teacher Leave</option>
                    <option value="SICK">Medical / Sick Absence</option>
                    <option value="EMERGENCY">Emergency Leave</option>
                    <option value="OFFICIAL_DUTY">On Duty / School Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Administrative Notes</label>
                  <textarea
                    rows="2"
                    placeholder="Instructions for substitute teacher or handover topics..."
                    value={subNotes}
                    onChange={(e) => setSubNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Verifying Availability...' : 'Confirm Substitution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
