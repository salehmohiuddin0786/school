'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  TrendingUp 
} from 'lucide-react';

export default function StudentProgressPage() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setMarks(d.marks || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalScored = marks.reduce((acc, m) => acc + (parseFloat(m.marks) || 0), 0);
  const totalMax = marks.reduce((acc, m) => acc + (parseFloat(m.total_marks) || 100), 0);
  const overallPercentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Academic Progress & Scorecards</h2>
          <p className="text-sm text-slate-500">Examine subject performance, test grades, and cumulative evaluation.</p>
        </div>

        {/* Aggregate Score Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Scored Marks</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{totalScored} / {totalMax}</div>
            <div className="text-xs text-slate-500 mt-1">Across all published tests</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Overall Percentage</span>
            <div className="text-3xl font-extrabold text-purple-600 mt-1">{overallPercentage}%</div>
            <div className="text-xs text-slate-500 mt-1">Cumulative performance</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Academic Standing</span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">
              {overallPercentage >= 75 ? 'Distinction' : overallPercentage >= 50 ? 'Good' : 'Needs Focus'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Performance assessment</div>
          </div>
        </div>

        {/* Detailed Marksheet */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900">Subject-wise Result Breakdown</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {marks.length} Subjects Graded
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading scorecard...</div>
          ) : marks.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No scorecards found for this student.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Subject</th>
                    <th className="py-4 px-6">Exam Title</th>
                    <th className="py-4 px-6 text-center">Marks Obtained</th>
                    <th className="py-4 px-6 text-center">Max Marks</th>
                    <th className="py-4 px-6 text-center">Passing Benchmark</th>
                    <th className="py-4 px-6 text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {marks.map((m) => {
                    const scored = parseFloat(m.marks) || 0;
                    const pass = parseFloat(m.passing_marks) || 33;
                    const isPass = scored >= pass;
                    return (
                      <tr key={m.s_no} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">{m.subject}</td>
                        <td className="py-4 px-6 text-xs text-slate-600">{m.exam_title || 'Class Test'}</td>
                        <td className="py-4 px-6 text-center font-extrabold text-slate-900">{m.marks}</td>
                        <td className="py-4 px-6 text-center text-slate-500">{m.total_marks || 100}</td>
                        <td className="py-4 px-6 text-center text-slate-500">{m.passing_marks || 33}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>{isPass ? 'Passed' : 'Failed'}</span>
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
