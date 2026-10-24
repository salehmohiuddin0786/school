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
  Sparkles
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
          // Strict Role-Based Protected Routes
          const userRole = data.user.role;
          if (role && userRole !== role) {
            // Allow owner/admin crossover, otherwise isolate students and teachers
            if (!(userRole === 'owner' && role === 'admin') && !(userRole === 'admin' && role === 'owner')) {
              if (userRole === 'student') router.replace('/student');
              else if (userRole === 'teacher') router.replace('/teacher');
              else if (userRole === 'admin') router.replace('/admin');
              else if (userRole === 'owner') router.replace('/owner');
            }
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
      { name: 'Classes & Fees', href: '/admin/classes-subjects', icon: BookOpen },
      { name: 'Exams & Timetable', href: '/admin/exams', icon: Award },
      { name: 'Bus Transport', href: '/admin/buses', icon: Bus },
      { name: 'Notice Board', href: '/admin/notices', icon: Bell },
    ],
    teacher: [
      { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
      { name: 'Mark Roll Call', href: '/teacher/attendance', icon: CalendarCheck },
      { name: 'Apply Leaves', href: '/teacher/leaves', icon: Clock },
      { name: 'Upload Marks', href: '/teacher/attendance', icon: Award },
    ],
    student: [
      { name: 'My Profile', href: '/student', icon: LayoutDashboard },
      { name: 'Fees & Invoices', href: '/student/fees', icon: CreditCard },
      { name: 'Exams & Progress', href: '/student/progress', icon: Award },
      { name: 'Bus Tracking', href: '/student/bus', icon: Bus },
    ],
    owner: [
      { name: 'Executive Overview', href: '/owner', icon: BarChart3 },
      { name: 'Fee Ledger', href: '/owner/fees', icon: CreditCard },
      { name: 'All Students', href: '/admin/students', icon: GraduationCap },
      { name: 'All Teachers', href: '/admin/teachers', icon: Users },
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
      { name: 'Leaves', href: '/teacher/leaves', icon: Clock },
    ],
    student: [
      { name: 'Profile', href: '/student', icon: LayoutDashboard },
      { name: 'Fees', href: '/student/fees', icon: CreditCard },
      { name: 'Marks', href: '/student/progress', icon: Award },
      { name: 'Bus', href: '/student/bus', icon: Bus },
    ],
    owner: [
      { name: 'Overview', href: '/owner', icon: BarChart3 },
      { name: 'Fee Ledger', href: '/owner/fees', icon: CreditCard },
      { name: 'Students', href: '/admin/students', icon: GraduationCap },
    ],
  }[role] || [];

  const navItems = roleNavItems[role] || roleNavItems.admin;

  const roleGradients = {
    admin: 'from-blue-600 via-indigo-600 to-indigo-800',
    teacher: 'from-emerald-600 via-teal-600 to-teal-800',
    student: 'from-violet-600 via-purple-600 to-purple-800',
    owner: 'from-amber-600 via-orange-600 to-orange-800',
  };

  const roleBadgeColors = {
    admin: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    teacher: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    student: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    owner: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
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
