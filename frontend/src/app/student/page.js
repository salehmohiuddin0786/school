'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  GraduationCap, 
  CreditCard, 
  Award, 
  CalendarCheck, 
  Clock, 
  Bus, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Bell
} from 'lucide-react';

export default function StudentDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const student = data?.student || {};
  const attendance = data?.attendance || {};
  const fees = data?.fees || [];
  const marks = data?.marks || [];
  const notices = data?.notices || [];

  const totalFeeBalance = fees.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Student Profile Hero Header */}
        <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-violet-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shrink-0">
              {student.fname ? student.fname[0].toUpperCase() : 'S'}
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-violet-300 tracking-wider">
                Student Profile &bull; ID: {student.id}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {student.fname} {student.lname}
              </h2>
              <p className="text-sm text-violet-200 mt-1">
                Enrolled: <span className="font-bold text-white">Class {student.class} - Section {student.section}</span> &bull; Father: {student.father || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/fees"
              className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105"
            >
              <CreditCard className="w-4 h-4" />
              <span>Fee Invoices</span>
            </Link>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Rate</div>
              <div className="text-3xl font-extrabold text-violet-600 mt-1">
                {loading ? '...' : `${attendance.percentage || 0}%`}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {attendance.presentDays || 0} of {attendance.totalDays || 0} Days Present
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Fee Balance</div>
              <div className={`text-3xl font-extrabold mt-1 ${totalFeeBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {loading ? '...' : `₹${totalFeeBalance.toLocaleString()}`}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {totalFeeBalance > 0 ? 'Outstanding due' : 'All accounts cleared'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Exam Results</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? '...' : marks.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Published scorecards</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Academic Marks & Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Latest Exam Grades */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Academic Scorecard</h3>
                  <p className="text-xs text-slate-500">Subject results & exam performance</p>
                </div>
              </div>
              <Link href="/student/progress" className="text-xs font-bold text-violet-600 hover:underline">
                View Full Card &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading academic scorecard...</div>
            ) : marks.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No exam marks published yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Exam</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {marks.map(m => {
                      const scoreNum = parseFloat(m.marks) || 0;
                      const passNum = parseFloat(m.passing_marks) || 33;
                      const isPass = scoreNum >= passNum;
                      return (
                        <tr key={m.s_no}>
                          <td className="py-3 px-4 font-bold text-slate-900">{m.subject}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">{m.exam_title || 'Class Test'}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">
                            {m.marks} / {m.total_marks || 100}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isPass ? 'Pass' : 'Need Revision'}
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

          {/* School Circulars */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Student Notices</h3>
                  <p className="text-xs text-slate-500">Official updates for students</p>
                </div>
              </div>

              {notices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No active circulars.</div>
              ) : (
                <div className="space-y-3">
                  {notices.map(n => (
                    <div key={n.s_no} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="font-bold text-xs text-slate-900">{n.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Campus Digital Sync</span>
              <Link href="/student/fees" className="font-bold text-violet-600 hover:underline">Fee Records</Link>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
