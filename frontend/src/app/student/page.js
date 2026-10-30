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
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Bell,
  Sparkles,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

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
  const attendance = data?.attendance || { percentage: 93, presentDays: 56, totalDays: 60 };
  const feeSummary = data?.feeSummary || { totalOutstanding: 0, totalPaid: 35000, clearanceRate: 100 };
  const marks = data?.marks || [];
  const notices = data?.notices || [];
  const todayRoutine = data?.todayRoutine || [];
  const transitBus = data?.transitBus || null;

  const attendanceDonut = attendance?.donut || [
    { name: 'Present', value: 56, color: '#8B5CF6' },
    { name: 'Absent', value: 3, color: '#EF4444' },
    { name: 'On Leave', value: 1, color: '#F59E0B' },
  ];

  const monthlyTrend = attendance?.monthlyTrend || [
    { month: 'Oct', rate: 91, score: 82 },
    { month: 'Nov', rate: 94, score: 85 },
    { month: 'Dec', rate: 90, score: 88 },
    { month: 'Jan', rate: 96, score: 90 },
    { month: 'Feb', rate: 93, score: 89 },
  ];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* STUDENT PROFILE HERO HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-950 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-purple-950/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
                {student.fname ? student.fname[0].toUpperCase() : 'S'}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3 h-3 text-violet-300" />
                  <span>Student ID #{student.id || 'STU-001'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {student.fname} {student.lname}
                </h1>
                <p className="text-sm text-violet-200 mt-0.5">
                  Enrolled Cohort: <span className="font-bold text-white">Class {student.class || '10'}-{student.section || 'A'}</span> &bull; Guardian: <span className="font-semibold text-white">{student.father || 'Parent'}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/student/fees"
                className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 shrink-0"
              >
                <CreditCard className="w-4 h-4" />
                <span>Tuition &amp; Fees</span>
              </Link>
              <Link
                href="/student/timetable"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-3 rounded-2xl border border-white/20 transition-all hover:scale-105 shrink-0"
              >
                <Clock className="w-4 h-4 text-violet-300" />
                <span>Class Routine</span>
              </Link>
            </div>
          </div>
          
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* BENTO GRID: TOP ROW — 4 METRIC KPI TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Attendance Rate */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-violet-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-violet-600 tracking-tight">
                {loading ? '...' : `${attendance.percentage}%`}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-600 font-semibold">
                  {attendance.presentDays} of {attendance.totalDays} Days Present
                </span>
                <span className="text-emerald-600 font-bold">Good Standing</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-violet-600 h-full rounded-full" 
                style={{ width: `${attendance.percentage}%` }}
              />
            </div>
          </div>

          {/* Card 2: Tuition Fee Status */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tuition Clearance</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : (feeSummary.totalOutstanding > 0 ? `₹${feeSummary.totalOutstanding.toLocaleString()}` : 'Cleared')}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className={feeSummary.totalOutstanding > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold flex items-center gap-1'}>
                  {feeSummary.totalOutstanding > 0 ? 'Pending Balance Due' : <><CheckCircle2 className="w-3.5 h-3.5" /> All Dues Cleared</>}
                </span>
                <span className="text-slate-400 font-semibold">{feeSummary.clearanceRate}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full ${feeSummary.totalOutstanding > 0 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                style={{ width: `${feeSummary.clearanceRate}%` }}
              />
            </div>
          </div>

          {/* Card 3: Academic Scorecard */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam Results</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : `${marks.length} Cards`}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-purple-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Published Results
                </span>
                <span className="text-slate-400 font-semibold">Term 2026</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full w-[88%]" />
            </div>
          </div>

          {/* Card 4: Campus Transit Bus */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transit Shuttle</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : (transitBus?.busNumber || 'Bus #04')}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-blue-600 font-bold">
                  {transitBus?.status || 'On Route'}
                </span>
                <span className="text-slate-400 font-semibold">Pickup {transitBus?.pickupTime || '07:45 AM'}</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full w-[95%]" />
            </div>
          </div>
        </div>

        {/* BENTO GRID: MIDDLE ROW — INTERACTIVE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Chart (8 cols): Monthly Attendance & Academic Performance Trend */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Academic &amp; Attendance Trajectory</h3>
                <p className="text-xs text-slate-500">Monthly attendance consistency tracking alongside exam assessment averages.</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 text-violet-600">
                  <span className="w-3 h-3 rounded-full bg-violet-600 inline-block" />
                  <span>Attendance %</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-indigo-500">
                  <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />
                  <span>Score Index</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studentAttGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="studentScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={[70, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      borderRadius: '16px', 
                      border: 'none', 
                      color: '#FFF', 
                      fontSize: '12px' 
                    }}
                    formatter={(val, name) => [`${val}%`, name === 'rate' ? 'Attendance' : 'Exam Score']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#8B5CF6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#studentAttGrad)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6366F1" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#studentScoreGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart (4 cols): Attendance Distribution Donut */}
          <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slate-900">Attendance Distribution</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700">
                  Term Total
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Classroom sessions attended this academic year.</p>
              
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {attendanceDonut.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0F172A', 
                        borderRadius: '12px', 
                        border: 'none', 
                        color: '#FFF', 
                        fontSize: '12px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">{attendance.percentage}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-2 pt-4 border-t border-slate-100">
              {attendanceDonut.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value} Days</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BENTO GRID: BOTTOM ROW — TODAY'S TIMETABLE & SCORECARD / NOTICES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Today's Period Routine (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Today&apos;s Class Routine</h3>
                  <p className="text-xs text-slate-500">Periods, assigned instructors, and lecture halls</p>
                </div>
              </div>
              <Link 
                href="/student/timetable" 
                className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1 group"
              >
                <span>Full Schedule</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-3">
              {todayRoutine.map((slot, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    slot.status === 'In Progress' 
                      ? 'bg-violet-50/70 border-violet-300 ring-2 ring-violet-400/20 shadow-sm' 
                      : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      slot.status === 'In Progress' 
                        ? 'bg-violet-600 text-white shadow-md' 
                        : (slot.status === 'Completed' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-800 border border-slate-200')
                    }`}>
                      P{slot.period}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{slot.subject}</span>
                        <span className="text-[11px] font-semibold text-slate-500">&bull; {slot.teacher}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {slot.time}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {slot.room}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      slot.status === 'In Progress'
                        ? 'bg-violet-600 text-white animate-pulse'
                        : (slot.status === 'Completed' ? 'bg-slate-200 text-slate-600' : 'bg-blue-50 text-blue-700')
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Scorecard & Announcements (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Scorecard &amp; Notices</h3>
                    <p className="text-xs text-slate-500">Recent examination grades &amp; announcements</p>
                  </div>
                </div>
              </div>

              {/* Subject Marks Table */}
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading scores...</div>
              ) : marks.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No scorecards published yet.</div>
              ) : (
                <div className="space-y-2 mb-6">
                  {marks.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{m.subject}</div>
                        <div className="text-[10px] text-slate-400">{m.exam_title || 'Term Assessment'}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm">{m.marks}</span>
                        <span className="text-[11px] text-slate-400"> / {m.total_marks || 100}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bulletins */}
              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Campus Circulars</div>
                <div className="space-y-2.5">
                  {notices.slice(0, 2).map((n, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100/60">
                      <div className="font-bold text-slate-900 text-xs line-clamp-1">{n.title}</div>
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{n.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center gap-3">
              <Link 
                href="/student/bus" 
                className="flex-1 inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all"
              >
                <Bus className="w-4 h-4" />
                <span>Track Bus Route</span>
              </Link>
              <Link 
                href="/student/progress" 
                className="flex-1 inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-all"
              >
                <Award className="w-4 h-4" />
                <span>Full Gradebook</span>
              </Link>
            </div>
          </div>
        </div>

        {/* OPERATIONS LAUNCHPAD: QUICK ACTION TILES */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Student Services Launchpad</h3>
              <p className="text-xs text-slate-500">Quick access to student accounts, transport, study resources, and academic filings.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Pay Fees', href: '/student/fees', icon: CreditCard, color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
              { label: 'Class Routine', href: '/student/timetable', icon: Clock, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
              { label: 'Transit Bus', href: '/student/bus', icon: Bus, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
              { label: 'Scorecards', href: '/student/progress', icon: Award, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
              { label: 'Assignments', href: '/student/assignments', icon: BookOpen, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
              { label: 'Circulars', href: '/student/notices', icon: Bell, color: 'text-rose-600 bg-rose-50 hover:bg-rose-100' },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center gap-2.5"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
