'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  BookOpen, 
  Bus, 
  Clock, 
  Bell, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              School Administration Overview
            </h2>
            <p className="text-sm text-indigo-200 mt-1">
              Live statistics, faculty operations, and student records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Add Student</span>
            </Link>
            <Link
              href="/admin/teachers"
              className="inline-flex items-center gap-2 bg-indigo-700/80 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-500/50 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Teacher</span>
            </Link>
          </div>
        </div>

        {/* Primary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Students</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats.totalStudents || 0)}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> Enrolled Active
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teachers</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats.totalTeachers || 0)}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Faculty Staff
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classes</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats.totalClasses || 0)}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-2">
              Academic standards
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buses</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats.totalBuses || 0)}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-2">
              Transport vehicles
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : (stats.pendingLeaves || 0)}
            </div>
            <div className="text-[11px] font-semibold text-rose-600 mt-2">
              Requires review
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today Attendance</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-indigo-600">
              {loading ? '...' : `${stats.todayAttendance?.rate || 0}%`}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-2">
              {stats.todayAttendance?.present || 0} Present today
            </div>
          </div>
        </div>

        {/* Section: Notices & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recent Notices */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recent Campus Notices</h3>
                  <p className="text-xs text-slate-500">Official broadcast communications</p>
                </div>
              </div>
              <Link 
                href="/admin/notices" 
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading notices...</div>
            ) : data?.recentNotices?.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No notices posted yet.</div>
            ) : (
              <div className="space-y-4">
                {data?.recentNotices?.map((n) => (
                  <div key={n.s_no} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {new Date(n.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Quick Management Actions</h3>
              <div className="space-y-2.5">
                <Link
                  href="/admin/attendance"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 text-sm font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck className="w-4 h-4 text-indigo-600" />
                    <span>Take Student Attendance</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/teacher-attendance"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 text-slate-700 hover:text-emerald-900 text-sm font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Staff Attendance & Leaves</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/classes-subjects"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 text-slate-700 hover:text-purple-900 text-sm font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Manage Classes & Fees</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/buses"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-100 hover:border-amber-200 text-slate-700 hover:text-amber-900 text-sm font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Bus className="w-4 h-4 text-amber-600" />
                    <span>Bus Fleet & Stops</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Academic Session Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 inline-block mb-3">
                  Academic Session 2026–2027
                </span>
                <h4 className="text-lg font-extrabold tracking-tight">Term II Active</h4>
                <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed">
                  Daily roll call, fee collections, and curriculum progress are synced and up-to-date.
                </p>
                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Campus In Session
                  </span>
                  <span className="font-bold text-white">Full Operations</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
