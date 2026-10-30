'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Award, 
  Plus, 
  Calendar, 
  BookOpen, 
  X, 
  CheckCircle2, 
  UserCheck,
  Clock,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  Building2,
  Eye
} from 'lucide-react';

export default function ExamsAdminPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [form, setForm] = useState({
    exam_title: '',
    subject: 'Mathematics',
    className: '10',
    section: 'A',
    exam_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '12:00',
    room: 'Hall A',
    total_marks: 100,
    passing_marks: 33,
    is_published: 1,
  });

  const [editForm, setEditForm] = useState({});

  const loadExams = () => {
    setLoading(true);
    const url = filterClass ? `/api/admin/exams?class=${encodeURIComponent(filterClass)}` : '/api/admin/exams';
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setExams(d.exams || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadExams();
  }, [filterClass]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_exam', ...form }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to schedule exam');
      }

      setMessage('Exam timetable slot created successfully!');
      setTimeout(() => setMessage(''), 3000);
      setModalOpen(false);
      loadExams();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const openEditModal = (ex) => {
    setSelectedExam(ex);
    setEditForm({
      exam_id: ex.exam_id,
      exam_title: ex.exam_title || '',
      subject: ex.subject || '',
      className: ex.class || '',
      section: ex.section || 'A',
      exam_date: ex.exam_date ? String(ex.exam_date).split('T')[0] : '',
      start_time: ex.start_time || '09:00',
      end_time: ex.end_time || '12:00',
      room: ex.room || '',
      total_marks: ex.total_marks || 100,
      passing_marks: ex.passing_marks || 33,
      is_published: ex.is_published ?? 1,
    });
    setErrorMsg('');
    setEditModalOpen(true);
  };

  const handleEditExam = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_exam', ...editForm }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to update exam');
      }

      setMessage('Exam updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      setEditModalOpen(false);
      loadExams();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Delete exam "${title}"? Associated marks will be removed.`)) return;
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_exam', exam_id: examId }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Exam deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        loadExams();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueClasses = Array.from(new Set(exams.map(e => e.class).filter(Boolean)));

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examination Schedule & Timetable</h2>
            <p className="text-sm text-slate-500">Plan exam dates, verify classroom conflict avoidance, and print official schedules.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintModalOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-3 rounded-2xl transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Timetable</span>
            </button>
            <button
              onClick={() => {
                setErrorMsg('');
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Exam</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600 uppercase">Filter Cohort:</span>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {exams.length} Exam Slots Scheduled
          </span>
        </div>

        {/* Exams List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading exams timetable...</div>
          ) : exams.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No scheduled exams. Click "Schedule New Exam" to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Exam Title</th>
                    <th className="py-4 px-6">Subject / Cohort</th>
                    <th className="py-4 px-6">Date & Timing</th>
                    <th className="py-4 px-6">Room / Venue</th>
                    <th className="py-4 px-6">Max / Pass</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {exams.map((ex) => (
                    <tr key={ex.s_no || ex.exam_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{ex.exam_title}</div>
                        <div className="text-xs text-slate-400 font-mono">{ex.exam_id}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{ex.subject}</div>
                        <div className="text-xs text-slate-500">
                          Class {ex.class} - Section {ex.section || 'A'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-700">
                        <div className="font-bold flex items-center gap-1.5 text-indigo-700">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{ex.exam_date ? String(ex.exam_date).split('T')[0] : 'TBD'}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{ex.start_time || '09:00'} - {ex.end_time || '12:00'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Building2 className="w-3 h-3" />
                          <span>{ex.room || 'Main Hall'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs">
                        <span className="font-bold text-slate-900">{ex.total_marks} Marks</span>
                        <span className="text-slate-400 block">Pass: {ex.passing_marks}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          ex.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ex.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Edit Exam Schedule"
                            onClick={() => openEditModal(ex)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete Exam"
                            onClick={() => handleDeleteExam(ex.exam_id, ex.exam_title)}
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

        {/* PRINTABLE TIMETABLE MODAL */}
        {printModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 print:hidden">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">Official Exam Timetable</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Now</span>
                  </button>
                  <button onClick={() => setPrintModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Schedule Sheet */}
              <div id="printable-exam-sheet" className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
                <div className="text-center pb-4 border-b-2 border-slate-800">
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">SchoolNext ERP Academy</h1>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">Comprehensive Examination Schedule & Room Allocations</p>
                  <div className="text-xs font-semibold text-slate-700 mt-2">
                    Academic Year 2025-2026 {filterClass ? `· Class ${filterClass}` : ''}
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 font-bold text-slate-900 uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Class & Section</th>
                      <th className="py-2.5 px-3">Subject / Paper</th>
                      <th className="py-2.5 px-3">Room / Hall</th>
                      <th className="py-2.5 px-3 text-right">Max Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {exams.map((ex, i) => (
                      <tr key={ex.exam_id || i}>
                        <td className="py-2.5 px-3 font-bold">{ex.exam_date ? String(ex.exam_date).split('T')[0] : 'TBD'}</td>
                        <td className="py-2.5 px-3">{ex.start_time || '09:00'} - {ex.end_time || '12:00'}</td>
                        <td className="py-2.5 px-3 font-semibold">Class {ex.class} - {ex.section || 'A'}</td>
                        <td className="py-2.5 px-3 font-bold text-indigo-900">{ex.subject} ({ex.exam_title})</td>
                        <td className="py-2.5 px-3 font-mono">{ex.room || 'Main Hall'}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{ex.total_marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                  <div>
                    <span className="block font-bold">Important Instructions:</span>
                    <span>1. Arrive at designated exam room 15 minutes before start time.</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold">Authorized Signatory</span>
                    <span className="block mt-6 border-t border-slate-400 w-32 ml-auto">Principal / Controller</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE EXAM MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-bold text-slate-900">Schedule Examination Slot</h3>
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

              <form onSubmit={handleCreateExam} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Exam Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mid-Term Examination 2026"
                    value={form.exam_title}
                    onChange={(e) => setForm({ ...form, exam_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10"
                      value={form.className}
                      onChange={(e) => setForm({ ...form, className: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mathematics"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={form.exam_date}
                      onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Room / Venue *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hall A or Room 204"
                      value={form.room}
                      onChange={(e) => setForm({ ...form, room: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Marks</label>
                    <input
                      type="number"
                      value={form.total_marks}
                      onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Passing Marks</label>
                    <input
                      type="number"
                      value={form.passing_marks}
                      onChange={(e) => setForm({ ...form, passing_marks: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

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
                    Save & Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT EXAM MODAL */}
        {editModalOpen && selectedExam && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-bold text-slate-900">Edit Exam Schedule</h3>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleEditExam} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Exam Title *</label>
                  <input
                    type="text"
                    required
                    value={editForm.exam_title}
                    onChange={(e) => setEditForm({ ...editForm, exam_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class *</label>
                    <input
                      type="text"
                      required
                      value={editForm.className}
                      onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Section</label>
                    <input
                      type="text"
                      value={editForm.section}
                      onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      value={editForm.subject}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={editForm.exam_date}
                      onChange={(e) => setEditForm({ ...editForm, exam_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={editForm.start_time}
                      onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={editForm.end_time}
                      onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Room / Venue *</label>
                    <input
                      type="text"
                      required
                      value={editForm.room}
                      onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Marks</label>
                    <input
                      type="number"
                      value={editForm.total_marks}
                      onChange={(e) => setEditForm({ ...editForm, total_marks: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Passing Marks</label>
                    <input
                      type="number"
                      value={editForm.passing_marks}
                      onChange={(e) => setEditForm({ ...editForm, passing_marks: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20"
                  >
                    Save Changes
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
