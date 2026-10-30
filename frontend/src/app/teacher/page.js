'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  BookOpen, 
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  MapPin,
  ChevronRight,
  TrendingUp,
  Bookmark
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
  CartesianGrid,
  Legend
} from 'recharts';

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
  const assignedStudents = data?.assignedStudentsCount || 0;
  const attendanceStats = data?.attendanceStats || { present: 28, absent: 3, leave: 1, rate: 92 };
  const attendanceDonut = data?.attendanceDonut || [
    { name: 'Present', value: 28, color: '#10B981' },
    { name: 'Absent', value: 3, color: '#EF4444' },
    { name: 'On Leave', value: 1, color: '#F59E0B' },
  ];
  const weeklyTrend = data?.weeklyTrend || [
    { day: 'Mon', attendance: 95, target: 90 },
    { day: 'Tue', attendance: 92, target: 90 },
    { day: 'Wed', attendance: 96, target: 90 },
    { day: 'Thu', attendance: 94, target: 90 },
    { day: 'Fri', attendance: 91, target: 90 },
  ];
  const todayRoutine = data?.todayRoutine || [];
  const myAttendance = data?.myAttendanceStats || { daysPresent: 22, totalWorkingDays: 24, rate: 95 };
  const notices = data?.notices || [];

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* WELCOME HERO BANNER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Faculty Instruction Desk</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome, {teacher.fname ? `${teacher.fname} ${teacher.lname || ''}`.trim() : 'Professor'}!
              </h1>
              <p className="text-sm text-emerald-200 mt-1 max-w-xl leading-relaxed">
                Primary Specialization: <span className="font-bold text-white">{teacher.subject || 'General Academics'}</span> &bull; Designated Classroom: <span className="font-bold text-white">{teacher.class ? `Class ${teacher.class}-${teacher.section || 'A'}` : 'All Assigned Sections'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/teacher/attendance"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 shrink-0"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Mark Student Attendance</span>
              </Link>
              <Link
                href="/teacher/assignments"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-3 rounded-2xl border border-white/20 transition-all hover:scale-105 shrink-0"
              >
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>Assignments</span>
              </Link>
            </div>
          </div>
          
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* BENTO GRID: TOP ROW — 4 KPI METRIC TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Assigned Classroom Cohort */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Cohort</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : assignedStudents}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Roster
                </span>
                <span className="text-slate-400 font-semibold">{teacher.class ? `Class ${teacher.class}` : 'General'}</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full w-[90%]" />
            </div>
          </div>

          {/* Card 2: Daily Class Roll Call */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-teal-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Attendance</span>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-teal-600 tracking-tight">
                {loading ? '...' : `${attendanceStats.rate}%`}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-600 font-semibold">
                  {attendanceStats.present} Present &bull; {attendanceStats.absent} Absent
                </span>
                <span className="text-teal-600 font-bold">Today</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-teal-600 h-full rounded-full" 
                style={{ width: `${attendanceStats.rate}%` }}
              />
            </div>
          </div>

          {/* Card 3: Faculty Own Duty Record */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Attendance</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : `${myAttendance.rate}%`}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {myAttendance.daysPresent} Days Present
                </span>
                <span className="text-slate-400 font-semibold">This Term</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full" 
                style={{ width: `${myAttendance.rate}%` }}
              />
            </div>
          </div>

          {/* Card 4: Homework & Grading Tasks */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Grading</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-amber-600 tracking-tight">
                {loading ? '...' : (data?.submissionsAwaitingGrade || 8)}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-amber-600 font-bold">
                  {data?.pendingAssignments || 2} Active Tasks
                </span>
                <span className="text-slate-400 font-semibold">Submissions</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full w-[70%]" />
            </div>
          </div>
        </div>

        {/* BENTO GRID: MIDDLE ROW — INTERACTIVE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Chart (8 cols): Weekly Attendance & Participation Trend */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Weekly Classroom Attendance & Engagement</h3>
                <p className="text-xs text-slate-500">Class {teacher.class ? `${teacher.class}-${teacher.section || 'A'}` : 'Assigned Section'} attendance tracking vs institutional 90% benchmark.</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span>Recorded Attendance %</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                  <span>Benchmark (90%)</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="teacherAttGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={[70, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      borderRadius: '16px', 
                      border: 'none', 
                      color: '#FFF', 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      fontSize: '12px' 
                    }}
                    formatter={(val) => [`${val}%`, 'Attendance']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#teacherAttGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart (4 cols): Today's Attendance Distribution */}
          <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slate-900">Roll Call Status</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Distribution across the assigned cohort.</p>
              
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
                  <span className="text-2xl font-black text-slate-900">{attendanceStats.rate}%</span>
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
                  <span className="font-bold text-slate-900">{item.value} Students</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BENTO GRID: BOTTOM ROW — TODAY'S ROUTINE & CAMPUS BULLETINS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Today's Teaching Schedule (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Today&apos;s Lecture Timetable</h3>
                  <p className="text-xs text-slate-500">Period schedule, assigned classrooms, and active slots</p>
                </div>
              </div>
              <Link 
                href="/teacher/timetable" 
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 group"
              >
                <span>Full Timetable</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-3">
              {todayRoutine.map((slot, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    slot.status === 'In Progress' 
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-sm' 
                      : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      slot.status === 'In Progress' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : (slot.status === 'Completed' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-800 border border-slate-200')
                    }`}>
                      P{slot.period}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{slot.subject}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                          {slot.class}
                        </span>
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
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : (slot.status === 'Completed' ? 'bg-slate-200 text-slate-600' : 'bg-blue-50 text-blue-700')
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campus Broadcasts & Faculty Notices (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Faculty Notices</h3>
                    <p className="text-xs text-slate-500">Official circulars & administrative directives</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading notices...</div>
              ) : notices.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No active circulars.</div>
              ) : (
                <div className="space-y-3">
                  {notices.map((n, idx) => (
                    <div 
                      key={n.s_no || idx} 
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">{n.title}</span>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-2">
                          {n.timestamp ? new Date(n.timestamp).toLocaleDateString() : 'Today'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6">
              <Link 
                href="/teacher/leaves" 
                className="w-full inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                <Calendar className="w-4 h-4 text-slate-600" />
                <span>Submit Faculty Leave Request</span>
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
              <h3 className="text-lg font-bold text-slate-900">Faculty Operations Launchpad</h3>
              <p className="text-xs text-slate-500">Instant shortcuts to daily teaching and academic management modules.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Mark Attendance', href: '/teacher/attendance', icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
              { label: 'Assignments', href: '/teacher/assignments', icon: FileText, color: 'text-teal-600 bg-teal-50 hover:bg-teal-100' },
              { label: 'Class Timetable', href: '/teacher/timetable', icon: Clock, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
              { label: 'My Attendance', href: '/teacher/my-attendance', icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
              { label: 'Leave Requests', href: '/teacher/leaves', icon: Calendar, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
              { label: 'Notice Board', href: '/teacher/notices', icon: Bell, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
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
