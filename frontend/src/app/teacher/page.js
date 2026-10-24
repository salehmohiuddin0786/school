'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  Award, 
  BookOpen, 
  ArrowRight,
  Bell,
  CheckCircle2
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const teacher = data?.teacher || {};

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-1">
              Faculty Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {teacher.fname ? `${teacher.fname} ${teacher.lname}` : 'Teacher'}!
            </h2>
            <p className="text-sm text-emerald-200 mt-1">
              Designated Subject: <span className="font-bold text-white">{teacher.subject || 'All Subjects'}</span> | Assigned Class: <span className="font-bold text-white">{teacher.class ? `Class ${teacher.class}-${teacher.section}` : 'N/A'}</span>
            </p>
          </div>

          <Link
            href="/teacher/attendance"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 shrink-0"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Today Roll Call</span>
          </Link>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Classroom Roll</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? '...' : (data?.assignedStudentsCount || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Students enrolled</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">My Leave Applications</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? '...' : (data?.myLeaves?.length || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Requests recorded</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Status</div>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">Active</div>
              <div className="text-xs text-slate-500 mt-1">Biometric & system sync</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Faculty Announcements</h3>
                  <p className="text-xs text-slate-500">Official circulars & department notices</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading notices...</div>
            ) : data?.notices?.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No announcements for faculty.</div>
            ) : (
              <div className="space-y-4">
                {data?.notices?.map(n => (
                  <div key={n.s_no} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(n.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Teacher Tasks</h3>
              <div className="space-y-2.5">
                <Link
                  href="/teacher/attendance"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 text-slate-700 hover:text-emerald-950 text-sm font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck className="w-4 h-4 text-emerald-600" />
                    <span>Daily Class Attendance</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/teacher/leaves"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 text-slate-700 hover:text-emerald-950 text-sm font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Apply for Leave</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/teacher/marks"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 text-slate-700 hover:text-emerald-950 text-sm font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Enter Student Marks</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
