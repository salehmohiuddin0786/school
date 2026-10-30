'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  CalendarCheck, 
  BookOpen, 
  Award, 
  Clock, 
  Bus, 
  Bell, 
  CreditCard, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  ShieldCheck,
  DollarSign,
  School,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function DashboardLayout({ children, role = 'admin' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          // Strict Role-Based Protected Routes — No cross-portal bleeding
          const userRole = data.user.role;
          if (role && userRole !== role) {
            if (userRole === 'student') router.replace('/student');
            else if (userRole === 'teacher') router.replace('/teacher');
            else if (userRole === 'admin') router.replace('/admin');
            else if (userRole === 'owner') router.replace('/owner');
            else if (userRole === 'parent') router.replace('/parent');
            else router.replace('/login');
          }
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router, role]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const roleNavItems = {
    admin: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Students', href: '/admin/students', icon: GraduationCap },
      { name: 'Faculty & Teachers', href: '/admin/teachers', icon: Users },
      { name: 'Student Roll Call', href: '/admin/attendance', icon: CalendarCheck },
      { name: 'Staff Attendance', href: '/admin/teacher-attendance', icon: UserCheck },
      { name: 'Teacher Substitution', href: '/admin/substitutions', icon: RefreshCw },
      { name: 'Classes & Fees', href: '/admin/classes-subjects', icon: BookOpen },
      { name: 'Fee Counter POS', href: '/admin/fees', icon: CreditCard },
      { name: 'Exam Timetable', href: '/admin/exams', icon: Award },
      { name: 'Report Cards (CBSE)', href: '/admin/exams/report-cards', icon: FileText },
      { name: 'Class Timetable', href: '/admin/timetable', icon: Clock },
      { name: 'Bus Transport', href: '/admin/buses', icon: Bus },
      { name: 'Notice Board', href: '/admin/notices', icon: Bell },
    ],
    teacher: [
      { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
      { name: 'Attendance & Roll Call', href: '/teacher/attendance', icon: CalendarCheck },
      { name: 'My Schedule', href: '/teacher/timetable', icon: Clock },
      { name: 'Assignments & LMS', href: '/teacher/assignments', icon: BookOpen },
      { name: 'Grade Assessments', href: '/teacher/marks', icon: Award },
      { name: 'Apply Leaves', href: '/teacher/leaves', icon: Clock },
      { name: 'Notice Board', href: '/teacher/notices', icon: Bell },
    ],
    student: [
      { name: 'My Profile', href: '/student', icon: LayoutDashboard },
      { name: 'My Timetable', href: '/student/timetable', icon: Clock },
      { name: 'Assignments & Homework', href: '/student/assignments', icon: BookOpen },
      { name: 'Fees & Invoices', href: '/student/fees', icon: CreditCard },
      { name: 'Exams & Progress', href: '/student/progress', icon: Award },
      { name: 'Notice Board', href: '/student/notices', icon: Bell },
      { name: 'Bus Tracking', href: '/student/bus', icon: Bus },
    ],
    owner: [
      { name: 'Executive Overview', href: '/owner', icon: BarChart3 },
      { name: 'Fee Ledger', href: '/owner/fees', icon: CreditCard },
      { name: 'All Students', href: '/owner/students', icon: GraduationCap },
      { name: 'All Teachers', href: '/owner/teachers', icon: Users },
      { name: 'Staff Payroll', href: '/owner/salaries', icon: DollarSign },
    ],
    parent: [
      { name: 'Parent Dashboard', href: '/parent', icon: LayoutDashboard },
      { name: 'Child Attendance', href: '/parent/attendance', icon: CalendarCheck },
      { name: 'Class Timetable', href: '/parent/timetable', icon: Clock },
      { name: 'Homework & LMS', href: '/parent/assignments', icon: BookOpen },
      { name: 'Report Cards', href: '/parent/exams', icon: Award },
      { name: 'Fee Invoices', href: '/parent/fees', icon: CreditCard },
      { name: 'School Notices', href: '/parent/notices', icon: Bell },
    ],
  };

  // Quick bottom nav shortcuts for mobile phones
  const mobileShortcuts = {
    admin: [
      { name: 'Home', href: '/admin', icon: LayoutDashboard },
      { name: 'Students', href: '/admin/students', icon: GraduationCap },
      { name: 'Teachers', href: '/admin/teachers', icon: Users },
      { name: 'Roll Call', href: '/admin/attendance', icon: CalendarCheck },
    ],
    teacher: [
      { name: 'Home', href: '/teacher', icon: LayoutDashboard },
      { name: 'Roll Call', href: '/teacher/attendance', icon: CalendarCheck },
      { name: 'Schedule', href: '/teacher/timetable', icon: Clock },
      { name: 'Homework', href: '/teacher/assignments', icon: BookOpen },
    ],
    student: [
      { name: 'Profile', href: '/student', icon: LayoutDashboard },
      { name: 'Timetable', href: '/student/timetable', icon: Clock },
      { name: 'Homework', href: '/student/assignments', icon: BookOpen },
      { name: 'Fees', href: '/student/fees', icon: CreditCard },
    ],
    owner: [
      { name: 'Overview', href: '/owner', icon: BarChart3 },
      { name: 'Fee Ledger', href: '/owner/fees', icon: CreditCard },
      { name: 'Students', href: '/owner/students', icon: GraduationCap },
      { name: 'Teachers', href: '/owner/teachers', icon: Users },
    ],
    parent: [
      { name: 'Home', href: '/parent', icon: LayoutDashboard },
      { name: 'Attendance', href: '/parent/attendance', icon: CalendarCheck },
      { name: 'Homework', href: '/parent/assignments', icon: BookOpen },
      { name: 'Fees', href: '/parent/fees', icon: CreditCard },
    ],
  }[role] || [];

  const navItems = roleNavItems[role] || roleNavItems.admin;

  const roleGradients = {
    admin: 'from-blue-600 via-indigo-600 to-indigo-800',
    teacher: 'from-emerald-600 via-teal-600 to-teal-800',
    student: 'from-violet-600 via-purple-600 to-purple-800',
    owner: 'from-amber-600 via-orange-600 to-orange-800',
    parent: 'from-cyan-600 via-sky-600 to-sky-800',
  };

  const roleBadgeColors = {
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    teacher: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    student: 'bg-violet-50 text-violet-700 border-violet-200',
    owner: 'bg-amber-50 text-amber-700 border-amber-200',
    parent: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800">
      
      {/* Mobile Off-canvas Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        />
      )}

      {/* Responsive Sidebar (Desktop Fixed + Mobile Slide-over) */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col justify-between
        transition-transform duration-300 ease-in-out border-r border-slate-800/90 shadow-2xl lg:shadow-none
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-20 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
            <Link href="/" className="flex items-center gap-3 group">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${roleGradients[role] || roleGradients.admin} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform`}>
                <School className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight block text-white">Digital Crowd</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                  {role} Portal
                </span>
              </div>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-4 mx-4 my-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleGradients[role] || roleGradients.admin} text-white flex items-center justify-center font-extrabold text-sm shadow-md`}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Authorized User'}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleBadgeColors[role] || roleBadgeColors.admin}`}>
                    {user?.role || role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links Scrollable */}
          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-thin">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3 py-1">
              Main Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-800/90 shrink-0 bg-slate-950/40">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs border border-rose-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Sticky Header Topbar */}
        <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 capitalize tracking-tight flex items-center gap-2">
                <span>{role} Workspace</span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Digital Crowd Academic Platform &bull; Session Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Session 2026–2027</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content (with mobile bottom padding so bottom nav doesn't cover content) */}
        <main className="p-3.5 sm:p-6 lg:p-8 flex-1 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Sticky Bottom Navigation Bar (<1024px) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 lg:hidden px-2 py-1.5 shadow-lg flex items-center justify-around">
          {mobileShortcuts.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-bold transition-all ${
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50 font-extrabold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>More</span>
          </button>
        </nav>

      </div>

    </div>
  );
}
