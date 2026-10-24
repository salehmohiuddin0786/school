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
  UserCheck 
} from 'lucide-react';

export default function ExamsAdminPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    exam_title: '',
    subject: 'Mathematics',
    className: '10',
    section: 'A',
    total_marks: 100,
    passing_marks: 33,
  });

  const loadExams = () => {
    setLoading(true);
    fetch('/api/admin/exams')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setExams(d.exams);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_exam', ...form }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Exam scheduled successfully!');
        setTimeout(() => setMessage(''), 3000);
        setModalOpen(false);
        loadExams();
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
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examinations & Grading</h2>
            <p className="text-sm text-slate-500">Schedule examinations, define pass criteria, and oversee academic grading.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Exam</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Exams List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading exams...</div>
          ) : exams.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No scheduled exams.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Exam Title</th>
                    <th className="py-4 px-6">Exam ID</th>
                    <th className="py-4 px-6">Subject</th>
                    <th className="py-4 px-6">Class</th>
                    <th className="py-4 px-6 text-center">Marks Range</th>
                    <th className="py-4 px-6">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {exams.map((ex) => (
                    <tr key={ex.s_no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {ex.exam_title}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-indigo-600">
                        {ex.exam_id}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {ex.subject}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        Class {ex.class} - {ex.section}
                      </td>
                      <td className="py-4 px-6 text-center text-xs">
                        <span className="font-bold text-emerald-600">Pass: {ex.passing_marks}</span> / Total: {ex.total_marks}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(ex.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Create Exam */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Schedule Examination</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateExam} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Exam Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mid-Term Examination 2026"
                    value={form.exam_title}
                    onChange={e => setForm({ ...form, exam_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class *</label>
                    <input
                      type="text"
                      required
                      value={form.className}
                      onChange={e => setForm({ ...form, className: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Section</label>
                    <input
                      type="text"
                      value={form.section}
                      onChange={e => setForm({ ...form, section: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Marks</label>
                    <input
                      type="number"
                      value={form.total_marks}
                      onChange={e => setForm({ ...form, total_marks: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Passing Marks</label>
                    <input
                      type="number"
                      value={form.passing_marks}
                      onChange={e => setForm({ ...form, passing_marks: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Schedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
