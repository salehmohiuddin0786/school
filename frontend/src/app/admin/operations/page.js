'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  CalendarCheck,
  UserCheck,
  RefreshCw,
  Clock,
  CreditCard,
  Bus,
  Award,
  FileText,
  Bell,
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function CampusOperationsPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d?.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  const operationModules = [
    {
      title: 'Student Roll Call',
      description: 'Daily classroom attendance logging, absent SMS triggers, and period roll call.',
      href: '/admin/attendance',
      icon: CalendarCheck,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Daily Core',
    },
    {
      title: 'Staff & Faculty Attendance',
      description: 'Teacher check-in, biometric tracking, leave approvals, and half-day logs.',
      href: '/admin/teacher-attendance',
      icon: UserCheck,
      color: 'from-emerald-500 to-teal-600',
      badge: 'HR / Staff',
    },
    {
      title: 'Teacher Substitution',
      description: 'Automated relief teacher allocation for absent faculty to prevent empty classes.',
      href: '/admin/substitutions',
      icon: RefreshCw,
      color: 'from-amber-500 to-orange-600',
      badge: 'Real-time',
    },
    {
      title: 'Class Timetable',
      description: 'Period-by-period bell schedule, weekly subject routines, and classroom assignments.',
      href: '/admin/timetable',
      icon: Clock,
      color: 'from-purple-500 to-indigo-600',
      badge: 'Academic',
    },
    {
      title: 'Fee Counter POS',
      description: 'Cash, UPI, and cheque fee collection desk, offline receipts, and fee clearance.',
      href: '/admin/fees',
      icon: CreditCard,
      color: 'from-emerald-600 to-green-700',
      badge: 'Accounts',
    },
    {
      title: 'Bus Transport Fleet',
      description: 'Bus route tracking, driver assignments, vehicle compliance, and stop allocation.',
      href: '/admin/buses',
      icon: Bus,
      color: 'from-amber-600 to-yellow-600',
      badge: 'Logistics',
    },
    {
      title: 'Examination Timetable',
      description: 'Midterm, final, and unit test date sheets, hall ticket generation, invigilation.',
      href: '/admin/exams',
      icon: Award,
      color: 'from-rose-500 to-pink-600',
      badge: 'Exams',
    },
    {
      title: 'CBSE Report Cards',
      description: 'Grading rubrics, scholastic performance, term marks compilation, and report cards.',
      href: '/admin/exams/report-cards',
      icon: FileText,
      color: 'from-blue-600 to-cyan-600',
      badge: 'Results',
    },
    {
      title: 'Class & Section Roster',
      description: 'Configure standard classes, division sections, maximum intake, and subjects.',
      href: '/admin/classes-subjects',
      icon: BookOpen,
      color: 'from-indigo-600 to-violet-600',
      badge: 'Structure',
    },
    {
      title: 'Campus Notice Board',
      description: 'Broadcast urgent circulars, holiday notices, and exam alerts to students & staff.',
      href: '/admin/notices',
      icon: Bell,
      color: 'from-red-500 to-rose-600',
      badge: 'Bulletins',
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Campus Operations Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Daily Campus Administration
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            All daily educational and campus management operations for <strong>{user?.campusName || 'your assigned campus'}</strong>. Manage classroom attendance, substitution routines, transport fleets, fee collection, and exams.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {operationModules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.title}
                href={m.href}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 hover:border-indigo-400 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors mt-4">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>Launch Module</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
