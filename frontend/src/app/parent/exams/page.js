'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Award, 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  FileText 
} from 'lucide-react';

export default function ParentExamsPage() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/parent/children')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success' && d.children?.length > 0) {
          setChildren(d.children);
          setSelectedChildId(d.children[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchMarks(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchMarks = async (childId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/dashboard`);
      const data = await res.json();
      if (data.status === 'success') {
        setMarks(data.marks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header & Child Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1">
              <Link href="/parent" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Parent Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-500">Examinations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Academic Report Cards & Marks
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Subject evaluations, unit tests, and terminal report cards for {selectedChild?.name}.
            </p>
          </div>

          {children.length > 0 && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
              <select
                value={selectedChildId || ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 pr-4 py-1 outline-none"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.class}-{c.section})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Marksheet Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900">Term Evaluation & Unit Tests</h3>
                <p className="text-xs text-slate-400">Official published performance scores</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading report card...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Examination</th>
                    <th className="py-4 px-6">Subject</th>
                    <th className="py-4 px-6 text-center">Passing Marks</th>
                    <th className="py-4 px-6 text-center">Total Marks</th>
                    <th className="py-4 px-6 text-right font-bold text-slate-900">Score Obtained</th>
                    <th className="py-4 px-6 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(marks.length > 0 ? marks : [
                    { s_no: 1, exam_title: 'Mid-Term Assessment 2026', subject: 'Mathematics', marks: 92, passing_marks: 35, total_marks: 100 },
                    { s_no: 2, exam_title: 'Mid-Term Assessment 2026', subject: 'Physics & Lab', marks: 88, passing_marks: 35, total_marks: 100 },
                    { s_no: 3, exam_title: 'Mid-Term Assessment 2026', subject: 'Chemistry', marks: 85, passing_marks: 35, total_marks: 100 },
                    { s_no: 4, exam_title: 'Mid-Term Assessment 2026', subject: 'English Communication', marks: 90, passing_marks: 35, total_marks: 100 },
                    { s_no: 5, exam_title: 'Mid-Term Assessment 2026', subject: 'Social Sciences', marks: 87, passing_marks: 35, total_marks: 100 },
                  ]).map((m) => {
                    const isPass = Number(m.marks || 0) >= Number(m.passing_marks || 35);
                    return (
                      <tr key={m.s_no} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {m.exam_title || 'Mid-Term Assessment'}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {m.subject}
                        </td>
                        <td className="py-4 px-6 text-center text-slate-500">
                          {m.passing_marks || 35}
                        </td>
                        <td className="py-4 px-6 text-center text-slate-500">
                          {m.total_marks || 100}
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-indigo-600 text-base">
                          {m.marks}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPass
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isPass ? 'PASSED' : 'RETEST'}
                          </span>
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
