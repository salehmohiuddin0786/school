'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  CreditCard, 
  Bus, 
  FileText, 
  ShieldCheck, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Award,
  Clock
} from 'lucide-react';

export default function Home() {
  const portals = [
    {
      title: 'Administrator',
      role: 'Admin Portal',
      desc: 'Complete control over students, teachers, academics, scheduling, and staff records.',
      href: '/login?role=admin',
      color: 'from-blue-600 to-indigo-600',
      badge: 'Management',
      icon: ShieldCheck,
    },
    {
      title: 'Faculty & Teachers',
      role: 'Teacher Portal',
      desc: 'Take classroom attendance, upload exam marks, request leaves, and manage curriculum.',
      href: '/login?role=teacher',
      color: 'from-emerald-600 to-teal-600',
      badge: 'Academic',
      icon: Users,
    },
    {
      title: 'Students & Parents',
      role: 'Student Portal',
      desc: 'View attendance percentage, academic performance, fee payments, and live bus tracking.',
      href: '/login?role=student',
      color: 'from-violet-600 to-purple-600',
      badge: 'Learning',
      icon: GraduationCap,
    },
    {
      title: 'Executive & Owner',
      role: 'Owner Portal',
      desc: 'Financial analytics, school revenue, fee collection, staff payroll, and profit & loss.',
      href: '/login?role=owner',
      color: 'from-amber-600 to-orange-600',
      badge: 'Executive',
      icon: BarChart3,
    },
  ];

  const features = [
    {
      icon: CalendarCheck,
      title: 'Automated Attendance',
      desc: 'Daily digital attendance tracking for both students and staff with percentage insights and monthly reporting.',
    },
    {
      icon: CreditCard,
      title: 'Fee & Billing Management',
      desc: 'Track tuition collections, pending balances, receipts, and class-wise fee structures seamlessly.',
    },
    {
      icon: Award,
      title: 'Exams & Performance',
      desc: 'Publish exam schedules, record subject marks, calculate grade metrics, and generate digital report cards.',
    },
    {
      icon: Bus,
      title: 'Fleet & Bus Tracking',
      desc: 'Route management, stop timings, and transport logistics to keep student commuting safe and transparent.',
    },
    {
      icon: FileText,
      title: 'Instant Noticeboard',
      desc: 'School-wide announcements, role-targeted notices, and critical event updates available 24/7.',
    },
    {
      icon: Clock,
      title: 'Timetables & Routines',
      desc: 'Dynamic weekly timetable scheduling for every class and section with teacher allocations.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-indigo-400/10 to-violet-400/10 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Next-Generation School Management Cloud</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Empowering Minds, Shaping Futures with{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
              Digital Crowd
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A comprehensive, all-in-one portal connecting administrators, educators, students, and executives in real-time.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all hover:-translate-y-0.5 text-base"
            >
              <span>Access Your Portal</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#portals"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-3.5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-all text-base"
            >
              Explore Portals
            </a>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-3xl font-extrabold text-indigo-600">100%</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Paperless Operations</div>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-3xl font-extrabold text-emerald-600">4-in-1</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Role-Based Portals</div>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-3xl font-extrabold text-violet-600">Real-Time</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Live Updates</div>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-3xl font-extrabold text-amber-600">Enterprise</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Bank-Grade Security</div>
            </div>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Dedicated Access</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Select Your Designated Portal
            </p>
            <p className="mt-4 text-base text-slate-600">
              Each stakeholder enjoys an optimized workspace tailored to their daily academic or managerial tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {portals.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="group relative bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
                        {p.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-1">{p.title}</h3>
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">{p.role}</div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">{p.desc}</p>
                  </div>

                  <Link
                    href={p.href}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-white group-hover:bg-indigo-600 text-slate-800 group-hover:text-white font-semibold text-sm border border-slate-200 group-hover:border-transparent transition-all shadow-sm group-hover:shadow-md"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Powerful Modules</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for Modern Educational Excellence
            </p>
            <p className="mt-4 text-base text-slate-600">
              Everything needed to orchestrate classrooms, faculty, finances, and transport seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              DC
            </div>
            <span className="text-white font-semibold">Digital Crowd Technologies</span>
            <span>&copy; 2026 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Portal Login</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
