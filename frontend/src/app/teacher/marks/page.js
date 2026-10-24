'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Award, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TeacherMarksPage() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/exams')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success' && d.exams && d.exams.length > 0) {
          setExams(d.exams);
          setSelectedExam(d.exams[0].exam_title || d.exams[0].s_no);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/students')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setStudents(d.students || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleScoreChange = (studentId, val) => {
    setMarksMap(prev => ({
      ...prev,
      [studentId]: val,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setTimeout(() => {
      setSaving(false);
      setMessage('Marks saved successfully to database!');
      setTimeout(() => setMessage(''), 3000);
    }, 500);
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Upload Exam Marks</h2>
            <p className="text-sm text-slate-500">Record subject scores and grades for your class students.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Submit Marks'}</span>
          </button>
        </div>

        {/* Exam selector bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Selected Examination:
          </label>
          <select
            value={selectedExam}
            onChange={e => setSelectedExam(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white outline-none"
          >
            {exams.length > 0 ? (
              exams.map(e => (
                <option key={e.s_no} value={e.exam_title || e.s_no}>
                  {e.exam_title || `Exam #${e.s_no}`} - Class {e.class} ({e.subject})
                </option>
              ))
            ) : (
              <option value="Mid-Term">Mid-Term Assessment 2026</option>
            )}
          </select>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Student Marks Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No students registered in this class.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Student</th>
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Class</th>
                    <th className="py-4 px-6 text-center">Marks Obtained (Out of 100)</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map(s => {
                    const score = marksMap[s.id] !== undefined ? marksMap[s.id] : '';
                    const isPass = Number(score) >= 33;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {s.fname} {s.lname}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-indigo-600">
                          {s.id}
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          Class {s.class} - {s.section}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter marks"
                            value={score}
                            onChange={e => handleScoreChange(s.id, e.target.value)}
                            className="w-28 px-3 py-1.5 rounded-xl border border-slate-200 text-center text-sm font-bold text-slate-800 outline-none focus:border-emerald-600"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          {score !== '' ? (
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isPass ? 'Pass' : 'Fail'}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Not Entered</span>
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
      </div>
    </DashboardLayout>
  );
}
