'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  Copy, 
  AlertCircle, 
  Sparkles,
  Users,
  BarChart3
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const demoAccounts = [
    {
      role: 'Admin',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      email: 'admin@gmail.com',
      password: '123',
      dest: '/admin',
      icon: ShieldCheck,
    },
    {
      role: 'Teacher',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      email: 'teacher@gmail.com',
      password: '123',
      dest: '/teacher',
      icon: Users,
    },
    {
      role: 'Student',
      badge: 'bg-violet-50 text-violet-700 border-violet-200',
      email: 'student@gmail.com',
      password: '123',
      dest: '/student',
      icon: GraduationCap,
    },
    {
      role: 'Owner',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      email: 'owner@gmail.com',
      password: '123',
      dest: '/owner',
      icon: BarChart3,
    },
  ];

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user?.role) {
          router.replace(`/${data.user.role}`);
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (roleParam) {
      const match = demoAccounts.find(d => d.role.toLowerCase() === roleParam.toLowerCase());
      if (match) {
        setEmail(match.email);
        setPassword(match.password);
      }
    }
  }, [roleParam]);

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Login failed');
      }

      // Redirect to respective dashboard
      if (data.role === 'admin') {
        router.push('/admin');
      } else if (data.role === 'teacher') {
        router.push('/teacher');
      } else if (data.role === 'student') {
        router.push('/student');
      } else if (data.role === 'owner') {
        router.push('/owner');
      } else {
        router.push('/admin');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-800/10">
        
        {/* Left Hero Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight block">Digital Crowd</span>
                <span className="text-xs text-indigo-200 tracking-wider uppercase block">School Portal</span>
              </div>
            </Link>

            <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-4">
              Welcome back to your academic ecosystem.
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed mb-8">
              Sign in with your role-assigned credentials to access your dashboard, metrics, classroom data, or administrative tools.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-indigo-100/90 bg-white/10 p-3 rounded-xl border border-white/10">
                <ShieldCheck className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Single Sign-On Role Separation</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-indigo-100/90 bg-white/10 p-3 rounded-xl border border-white/10">
                <Sparkles className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Instant Campus & Record Sync</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15 text-xs text-indigo-200 flex justify-between items-center">
            <span>&copy; 2026 Digital Crowd</span>
            <Link href="/" className="hover:text-white transition-colors">← Back to Website</Link>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sign In
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Enter your registered school email address and password.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@gmail.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Login to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Table */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quick Demo Access
                </span>
                <span className="text-xs text-indigo-600 font-medium">Click to auto-fill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((acc, idx) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickFill(acc)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">{acc.role}</div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[110px]">{acc.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        Fill
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">Loading portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
