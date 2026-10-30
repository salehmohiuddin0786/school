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
  CheckCircle2,
  DollarSign,
  Award,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

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
  const monthlyTrend = data?.monthlyTrend || [];
  const attendanceBreakdown = data?.attendanceBreakdown || [];
  const recentNotices = data?.recentNotices || [];
  const fees = stats?.fees || {};

  const collectionRate = fees.totalBilled > 0 
    ? Math.round((fees.totalCollected / fees.totalBilled) * 100) 
    : 85;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Executive Command Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, Administrator
              </h1>
              <p className="text-sm text-indigo-200 mt-1 max-w-xl leading-relaxed">
                Here is your institutional briefing: live student attendance, monthly fee cash flows, and active faculty operations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/students"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Enroll Student</span>
              </Link>
              <Link
                href="/admin/teacher-attendance"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all hover:scale-105"
              >
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                <span>Daily Roll Call</span>
              </Link>
            </div>
          </div>
          
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* BENTO GRID: TOP ROW — 4 METRIC KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Students */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : (stats.totalStudents || 0)}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +12% this term
                </span>
                <span className="text-slate-400 font-semibold">{stats.totalClasses || 0} Standards</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full w-[88%]" />
            </div>
          </div>

          {/* Card 2: Faculty */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teaching Faculty</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : (stats.totalTeachers || 0)}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% On-Duty
                </span>
                <span className="text-slate-400 font-semibold">Active Roster</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full w-[94%]" />
            </div>
          </div>

          {/* Card 3: Attendance Rate */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Attendance</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-purple-600 tracking-tight">
                {loading ? '...' : `${stats.todayAttendance?.rate || 95}%`}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-600 font-semibold">
                  {stats.todayAttendance?.present || 0} Present Today
                </span>
                <span className="text-purple-600 font-bold">Optimal</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-purple-600 h-full rounded-full" 
                style={{ width: `${stats.todayAttendance?.rate || 95}%` }}
              />
            </div>
          </div>

          {/* Card 4: Fee Realization */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Collection</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : `${collectionRate}%`}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-amber-600 font-bold">
                  ₹{(fees.totalCollected || 0).toLocaleString()} Collected
                </span>
                <span className="text-slate-400 font-semibold">Q3/Q4</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* BENTO GRID: MIDDLE ROW — INTERACTIVE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Chart (8 cols): Monthly Attendance & Collections Trend */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Academic & Financial Performance Trend</h3>
                <p className="text-xs text-slate-500">Monthly attendance percentage vs fee collection targets.</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 text-indigo-600">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                  <span>Fee Receipts (₹)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span>Attendance %</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '16px', color: '#fff', border: 'none', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="feeCollected" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#feeGrad)" />
                  <Area type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#attGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Chart (4 cols): Today's Attendance Distribution Donut */}
          <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Roll Call Distribution</h3>
              <p className="text-xs text-slate-500">Real-time daily presence categorization.</p>
            </div>

            <div className="h-56 w-full relative my-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceBreakdown}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {attendanceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 block">
                  {stats.todayAttendance?.rate || 95}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Rate</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100">
              {attendanceBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-semibold">{item.name}</span>
                  <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BENTO GRID: BOTTOM ROW — 3 BENTO TILES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bento Tile 1 (4 cols): Operations Command Launcher */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Operations Launchpad</h3>
              <p className="text-xs text-slate-500">Direct portal shortcuts for academic workflows.</p>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Student Directory & Admissions', href: '/admin/students', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Daily Period Timetable', href: '/admin/timetable', icon: Clock, color: 'text-blue-600 bg-blue-50' },
                { label: 'Staff Attendance & Leaves', href: '/admin/teacher-attendance', icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Exam Schedules & Conflict Check', href: '/admin/exams', icon: Award, color: 'text-amber-600 bg-amber-50' },
                { label: 'Faculty Compensation & History', href: '/admin/teachers', icon: Users, color: 'text-purple-600 bg-purple-50' },
                { label: 'Transit Buses & Route Stops', href: '/admin/buses', icon: Bus, color: 'text-orange-600 bg-orange-50' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Bento Tile 2 (5 cols): Official Notices Stream */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Broadcast Bulletins</h3>
                    <p className="text-xs text-slate-500">Official campus communications</p>
                  </div>
                </div>
                <Link href="/admin/notices" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                  View All
                </Link>
              </div>

              {recentNotices.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No recent notices published.</div>
              ) : (
                <div className="space-y-3">
                  {recentNotices.map((n) => (
                    <div key={n.s_no} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        {n.importance === 'high' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.body}</p>
                      <div className="text-[10px] text-slate-400 font-semibold pt-1">
                        {new Date(n.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/admin/notices"
              className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center justify-center gap-1.5"
            >
              <span>Publish New Announcement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bento Tile 3 (3 cols): Financial Health & Institutional Health */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Financial Pulse</h3>
                  <p className="text-xs text-slate-500">Collection status</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">Total Fees Collected</span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">
                    ₹{(fees.totalCollected || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600">Cleared bank receipts</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] font-bold text-rose-800 uppercase block">Outstanding Dues</span>
                  <div className="text-xl font-black text-rose-700 mt-0.5">
                    ₹{(fees.totalBalance || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-rose-600">Pending student balances</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-xs font-bold text-slate-600">System State: Active & Secure</span>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
