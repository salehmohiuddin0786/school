'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  BookOpen, 
  CreditCard, 
  Plus, 
  X, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';

export default function ClassesSubjectsPage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classModal, setClassModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);

  const [classForm, setClassForm] = useState({ className: '', section: 'A', fees: '' });
  const [subjectForm, setSubjectForm] = useState({ subject_name: '', className: '10' });
  const [message, setMessage] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/classes').then(r => r.json()),
      fetch('/api/admin/subjects').then(r => r.json()),
    ])
      .then(([cData, sData]) => {
        if (cData.status === 'success') setClasses(cData.classes);
        if (sData.status === 'success') setSubjects(sData.subjects);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Class created successfully!');
        setTimeout(() => setMessage(''), 3000);
        setClassModal(false);
        setClassForm({ className: '', section: 'A', fees: '' });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectForm),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Subject created successfully!');
        setTimeout(() => setMessage(''), 3000);
        setSubjectModal(false);
        setSubjectForm({ subject_name: '', className: '10' });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-7xl mx-auto">
        
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Classes, Sections & Subjects</h2>
          <p className="text-sm text-slate-500">Configure academic structures, tuition fees, and curriculum subjects.</p>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Classes & Fees Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Class Fee Structures</h3>
                  <p className="text-xs text-slate-500">{classes.length} Configured Standards</p>
                </div>
              </div>
              <button
                onClick={() => setClassModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Class</span>
              </button>
            </div>

            <div className="space-y-3">
              {classes.map((c) => (
                <div key={c.s_no} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900">Class {c.class}</div>
                    <div className="text-xs text-slate-500 font-semibold">Section {c.section}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-indigo-600">
                      ₹{c.fees?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">Monthly Fee</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Curriculum Subjects</h3>
                  <p className="text-xs text-slate-500">{subjects.length} Registered Subjects</p>
                </div>
              </div>
              <button
                onClick={() => setSubjectModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            </div>

            <div className="space-y-3">
              {subjects.map((s) => (
                <div key={s.s_no} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900">{s.subject_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{s.subject_id}</div>
                  </div>
                  <div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Class {s.class}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal: Add Class */}
        {classModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Add New Class</h3>
                <button onClick={() => setClassModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddClass} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 11"
                    value={classForm.className}
                    onChange={e => setClassForm({ ...classForm, className: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={classForm.section}
                    onChange={e => setClassForm({ ...classForm, section: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Monthly Tuition Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={classForm.fees}
                    onChange={e => setClassForm({ ...classForm, fees: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setClassModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Save Class</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Subject */}
        {subjectModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Add New Subject</h3>
                <button onClick={() => setSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddSubject} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. English Literature"
                    value={subjectForm.subject_name}
                    onChange={e => setSubjectForm({ ...subjectForm, subject_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10"
                    value={subjectForm.className}
                    onChange={e => setSubjectForm({ ...subjectForm, className: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setSubjectModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">Save Subject</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
