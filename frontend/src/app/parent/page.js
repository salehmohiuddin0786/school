'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  ChevronDown, 
  CalendarCheck, 
  BookOpen, 
  CreditCard, 
  Clock, 
  Award, 
  Bell, 
  FileText, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function ParentDashboardPage() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/parent/children');
      const data = await res.json();
      if (data.status === 'success' && data.children?.length > 0) {
        setChildren(data.children);
        setSelectedChildId(data.children[0].id);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      fetchChildOverview(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchChildOverview = async (childId) => {
    try {
      const res = await fetch(`/api/parent/overview?studentId=${childId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setOverview(data.overview);
      }
    } catch (err) {
      console.error('Failed to load child overview:', err);
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  return (
    <DashboardLayout role="parent">
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Child Selector & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-sky-600 tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span>Parent & Guardian Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Academic Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time monitoring of attendance, class routines, pending homework, and fee payments.
            </p>
          </div>

          {/* Child Switcher Dropdown */}
          {children.length > 0 && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
              <select
                value={selectedChildId || ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 pr-6 py-1 outline-none cursor-pointer"
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

        {/* Selected Child Hero Banner */}
        {selectedChild && (
          <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-sky-950/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                {selectedChild.name?.[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-400/20 text-sky-300 border border-sky-400/30">
                    Relationship: {selectedChild.relationship || 'Ward'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200">
                    Roll: {selectedChild.roll_no}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  {selectedChild.name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-sky-200 mt-1">
                  <span>Enrolled: {selectedChild.class} - Section {selectedChild.section}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    {selectedChild.campus || 'Main Campus'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/parent/fees"
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all hover:scale-105"
              >
                <CreditCard className="w-4 h-4" />
                <span>Fee Invoices</span>
              </Link>
              <Link
                href="/parent/timetable"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-white/20 transition-all"
              >
                <Clock className="w-4 h-4" />
                <span>Class Schedule</span>
              </Link>
            </div>
          </div>
        )}

        {/* 4 Feature Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Turnout</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {overview?.attendance?.rate || 96}%
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>{overview?.attendance?.presentDays || 24} Sessions Present</span>
              <Link href="/parent/attendance" className="font-bold text-sky-600 hover:underline">
                Details &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Homework</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-600">
              {overview?.homework?.pendingCount || 0}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>{overview?.homework?.submittedCount || 0} Completed Tasks</span>
              <Link href="/parent/assignments" className="font-bold text-sky-600 hover:underline">
                View &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Fees</span>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-3xl font-extrabold ${(overview?.fees?.balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₹{(overview?.fees?.balance || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>{overview?.fees?.status || 'Cleared'}</span>
              <Link href="/parent/fees" className="font-bold text-sky-600 hover:underline">
                Pay/Print &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Published Results</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-indigo-600">
              Grade A+
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>Term Evaluation Available</span>
              <Link href="/parent/exams" className="font-bold text-sky-600 hover:underline">
                Report Card &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Portal Shortcuts Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/parent/attendance"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 hover:bg-sky-50/30 transition-all text-center group"
          >
            <CalendarCheck className="w-6 h-6 text-sky-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 block">Attendance Log</span>
          </Link>

          <Link
            href="/parent/timetable"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 hover:bg-sky-50/30 transition-all text-center group"
          >
            <Clock className="w-6 h-6 text-sky-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 block">Class Schedule</span>
          </Link>

          <Link
            href="/parent/assignments"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 hover:bg-sky-50/30 transition-all text-center group"
          >
            <BookOpen className="w-6 h-6 text-sky-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 block">Homework Dues</span>
          </Link>

          <Link
            href="/parent/fees"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 hover:bg-sky-50/30 transition-all text-center group"
          >
            <CreditCard className="w-6 h-6 text-sky-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 block">Invoices & Fees</span>
          </Link>

          <Link
            href="/parent/exams"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 hover:bg-sky-50/30 transition-all text-center group"
          >
            <Award className="w-6 h-6 text-sky-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 block">Report Cards</span>
          </Link>

          <Link
            href="/parent/notices"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 hover:bg-sky-50/30 transition-all text-center group"
          >
            <Bell className="w-6 h-6 text-sky-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 block">School Notices</span>
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
}
