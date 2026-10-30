'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Coffee, 
  BookOpen, 
  User, 
  Building2, 
  Edit2, 
  Trash2,
  Filter
} from 'lucide-react';

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function AdminTimetablePage() {
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState('MONDAY');
  
  const [entries, setEntries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    period_number: 1,
    period_name: 'Period 1',
    start_time: '09:00',
    end_time: '09:45',
    subject: 'Mathematics',
    teacher_id: '',
    classroom: 'Room 101',
    is_break: false,
  });

  // Load classes & teachers
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/classes').then(r => r.json()),
      fetch('/api/admin/teachers').then(r => r.json()),
    ]).then(([cData, tData]) => {
      if (cData.status === 'success') setClasses(cData.classes || []);
      if (tData.status === 'success') setTeachers(tData.teachers || []);
    }).catch(console.error);
  }, []);

  const loadTimetable = () => {
    setLoading(true);
    fetch(`/api/admin/timetable?class=${selectedClass}&section=${selectedSection}&weekday=${selectedDay}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setEntries(d.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTimetable();
  }, [selectedClass, selectedSection, selectedDay]);

  const handleOpenAdd = () => {
    setEditingEntry(null);
    const nextPeriod = entries.length > 0 ? Math.max(...entries.map(e => e.period_number)) + 1 : 1;
    setForm({
      period_number: nextPeriod,
      period_name: `Period ${nextPeriod}`,
      start_time: '09:00',
      end_time: '09:45',
      subject: 'Mathematics',
      teacher_id: teachers[0]?.id || '',
      classroom: 'Room 101',
      is_break: false,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      period_number: entry.period_number,
      period_name: entry.period_name,
      start_time: entry.start_time,
      end_time: entry.end_time,
      subject: entry.subject,
      teacher_id: entry.teacher_id || '',
      classroom: entry.classroom || '',
      is_break: Boolean(entry.is_break),
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        ...form,
        id: editingEntry ? editingEntry.id : undefined,
        className: selectedClass,
        section: selectedSection,
        weekday: selectedDay,
      };

      const res = await fetch('/api/admin/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to save timetable slot');
      }

      setMessage(editingEntry ? 'Period updated successfully!' : 'Period added to timetable!');
      setTimeout(() => setMessage(''), 3000);
      setModalOpen(false);
      loadTimetable();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Remove this period from timetable?')) return;
    try {
      const res = await fetch(`/api/admin/timetable?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Period removed successfully');
        setTimeout(() => setMessage(''), 3000);
        loadTimetable();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const uniqueClasses = Array.from(new Set(classes.map(c => String(c.class || '').trim()))).filter(Boolean);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daily Period Timetable Management</h2>
            <p className="text-sm text-slate-500">Configure class routine periods, assigned faculty, break intervals, and eliminate room conflicts.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Period</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Filter bar: Class & Section */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-600 uppercase">Class:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white outline-none"
              >
                {uniqueClasses.length > 0 ? (
                  uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)
                ) : (
                  <>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                    <option value="12c">Class 12c</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Section:</span>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700">
            Active Routine: Class {selectedClass} - {selectedSection}
          </span>
        </div>

        {/* Weekday Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {WEEKDAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Timetable Slots Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading daily timetable routine...</div>
          ) : entries.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">
              No periods scheduled for Class {selectedClass}-{selectedSection} on {selectedDay}.
              <div className="mt-3">
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs"
                >
                  Schedule Period 1 Now
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Period</th>
                    <th className="py-4 px-6">Timing</th>
                    <th className="py-4 px-6">Subject / Activity</th>
                    <th className="py-4 px-6">Assigned Faculty</th>
                    <th className="py-4 px-6">Classroom</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        entry.is_break ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-slate-900 block">{entry.period_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">Slot #{entry.period_number}</span>
                      </td>
                      <td className="py-4 px-6 text-xs text-indigo-700 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{entry.start_time} - {entry.end_time}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {entry.is_break ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Coffee className="w-3.5 h-3.5" />
                            <span>{entry.subject || 'Break / Recess'}</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-900">{entry.subject}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs">
                        {entry.is_break ? (
                          <span className="text-slate-400 italic">Common Recess</span>
                        ) : entry.teacher_fname ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-800">{entry.teacher_fname} {entry.teacher_lname}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-slate-700">
                        {entry.classroom ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{entry.classroom}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Edit Period"
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete Slot"
                            onClick={() => handleDeleteSlot(entry.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ADD / EDIT SLOT MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingEntry ? 'Edit Period Slot' : 'Add Period Slot'} ({selectedDay})
                  </h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveSlot} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Period Number *</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={form.period_number}
                      onChange={e => setForm({ ...form, period_number: e.target.value, period_name: `Period ${e.target.value}` })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Period Label</label>
                    <input
                      type="text"
                      value={form.period_name}
                      onChange={e => setForm({ ...form, period_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={form.start_time}
                      onChange={e => setForm({ ...form, start_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={form.end_time}
                      onChange={e => setForm({ ...form, end_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Break / Lunch toggle */}
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-900">Break / Lunch Interval</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_break}
                    onChange={e => setForm({ ...form, is_break: e.target.checked, subject: e.target.checked ? 'Lunch Break' : form.subject })}
                    className="w-4 h-4 accent-amber-600 cursor-pointer"
                  />
                </div>

                {!form.is_break && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Subject *</label>
                        <input
                          type="text"
                          required
                          value={form.subject}
                          onChange={e => setForm({ ...form, subject: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Classroom</label>
                        <input
                          type="text"
                          value={form.classroom}
                          onChange={e => setForm({ ...form, classroom: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assigned Teacher</label>
                      <select
                        value={form.teacher_id}
                        onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-slate-800"
                      >
                        <option value="">-- Unassigned --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.fname} {t.lname} ({t.subject || 'Faculty'})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20"
                  >
                    {editingEntry ? 'Update Period' : 'Save Slot'}
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
