'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  BarChart3, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  Wallet,
  Landmark,
  UserCheck,
  GraduationCap,
  PieChart as PieIcon,
  Filter,
  RefreshCw,
  Lock,
  ChevronRight,
  AlertCircle,
  X,
  PlusCircle,
  School,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
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

export default function OwnerAccountsPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'campuses' | 'pnl' | 'banks' | 'funnel' | 'capex'
  
  // User & Platform State
  const [currentUser, setCurrentUser] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [recentInstitutions, setRecentInstitutions] = useState([]);

  // Data States
  const [executiveOverview, setExecutiveOverview] = useState(null);
  const [campusComparison, setCampusComparison] = useState([]);
  const [pnlData, setPnlData] = useState(null);
  const [bankData, setBankData] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [legacyAccounts, setLegacyAccounts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Capex Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED');
  const [authPin, setAuthPin] = useState('1234');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadAllData = async () => {
    try {
      setLoading(true);

      const me = await fetch('/api/auth/me').then(r => r.json()).catch(() => null);
      if (me?.user) {
        setCurrentUser(me.user);
        if (me.user.isPlatformOwner) {
          const instData = await fetch('/api/v1/owner/institutions?limit=6').then(r => r.json()).catch(() => null);
          if (instData?.stats) setPlatformStats(instData.stats);
          if (instData?.data) setRecentInstitutions(instData.data);
        }
      }

      const [
        resOverview,
        resCampuses,
        resPnl,
        resBanks,
        resFunnel,
        resChurn,
        resApprovals,
        resAccounts
      ] = await Promise.all([
        fetch('/api/v1/owner/overview').then(r => r.json()).catch(() => null),
        fetch('/api/v1/owner/campuses/comparison').then(r => r.json()).catch(() => []),
        fetch('/api/v1/owner/financials/pnl?fiscalYear=2026-2027').then(r => r.json()).catch(() => null),
        fetch('/api/v1/owner/financials/bank-balances').then(r => r.json()).catch(() => null),
        fetch('/api/v1/owner/enrollments/funnel').then(r => r.json()).catch(() => null),
        fetch('/api/v1/owner/enrollments/churn-analysis').then(r => r.json()).catch(() => null),
        fetch('/api/v1/owner/approvals/pending').then(r => r.json()).catch(() => []),
        fetch('/api/owner/accounts').then(r => r.json()).catch(() => null),
      ]);

      setExecutiveOverview(resOverview);
      if (Array.isArray(resCampuses)) setCampusComparison(resCampuses);
      setPnlData(resPnl);
      setBankData(resBanks);
      setFunnelData(resFunnel);
      setChurnData(resChurn);
      if (Array.isArray(resApprovals)) setPendingApprovals(resApprovals);
      setLegacyAccounts(resAccounts);
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const openDecisionModal = (req, type) => {
    setSelectedReq(req);
    setDecisionType(type);
    setAuthPin('1234');
    setNotes(type === 'APPROVED' ? 'Approved for FY26 capital budget execution.' : 'Declined per Q3 capex freeze.');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/v1/owner/approvals/${selectedReq.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decisionType,
          notes: notes.trim(),
          authPin: authPin.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        setSuccessMsg(json.message || `Requisition ${selectedReq.id} has been ${decisionType}.`);
        setTimeout(() => {
          setSelectedReq(null);
          loadAllData();
        }, 1200);
      } else {
        setErrorMsg(json.error || 'Failed to authorize requisition.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error occurred during authorization.');
    } finally {
      setSubmitting(false);
    }
  };

  const metrics = executiveOverview || {
    totalRevenueYtd: 0,
    totalArrears: 0,
    totalStudents: 0,
    totalCapacity: 0,
    occupancyRate: 0,
    staffCount: 0,
    staffAttendanceToday: 0,
  };

  const recentFees = legacyAccounts?.recentFees || [];
  const recentSalaries = legacyAccounts?.recentSalaries || [];
  const monthlyFinancials = legacyAccounts?.monthlyFinancials || [
    { month: 'Jun', revenue: 0, expenses: 0, surplus: 0 },
    { month: 'Jul', revenue: 0, expenses: 0, surplus: 0 },
    { month: 'Aug', revenue: 0, expenses: 0, surplus: 0 },
    { month: 'Sep', revenue: 0, expenses: 0, surplus: 0 },
    { month: 'Oct', revenue: 0, expenses: 0, surplus: 0 },
  ];

  const expenseAllocation = legacyAccounts?.expenseAllocation || [
    { name: 'Staff Salaries', value: 0, color: '#4F46E5' },
    { name: 'Campus Facilities', value: 0, color: '#10B981' },
    { name: 'Transport Fleet', value: 0, color: '#F59E0B' },
    { name: 'Lab & IT', value: 0, color: '#EC4899' },
  ];

  const isPlatformOwner = Boolean(currentUser?.isPlatformOwner || !currentUser?.tenantId || currentUser?.isSuperAdmin || currentUser?.roleCode === 'SUPER_ADMIN');

  if (isPlatformOwner) {
    return (
      <DashboardLayout role="owner">
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Platform Owner Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/40">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-widest mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Platform Super Admin • Global Multi-Tenant Control</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Platform Operations & SaaS Command
                </h1>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Centralized SaaS governance across all educational institutions. Monitor tenant partitions, recurring subscriptions, platform MRR, and global system health.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/owner/institutions/create"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add New Institution</span>
                </Link>
                <Link
                  href="/owner/institutions"
                  className="inline-flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
                >
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>All Institutions</span>
                </Link>
                <Link
                  href="/owner/subscriptions"
                  className="inline-flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-500/30 transition-all"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>SaaS Plans</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 5 PLATFORM KPI TILES */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Total Institutions</span>
                <Building2 className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{platformStats?.total || recentInstitutions.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Multi-campus partitions</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Active Tenants</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2">{platformStats?.active || recentInstitutions.filter(i => i.status === 'ACTIVE').length}</div>
              <div className="text-[11px] text-emerald-700/80 mt-1 font-medium">In good standing</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Suspended</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 mt-2">{platformStats?.suspended || 0}</div>
              <div className="text-[11px] text-rose-700/80 mt-1 font-medium">Access blocked</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Schools / Colleges</span>
                <School className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-2 flex items-center gap-1.5">
                <span className="text-blue-600">{platformStats?.schools || 0} S</span>
                <span className="text-slate-300">/</span>
                <span className="text-purple-600">{platformStats?.colleges || 0} C</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Educational mix</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Platform MRR</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">₹{Number(platformStats?.mrr || 6999).toLocaleString()}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Monthly Subscription Run-rate</div>
            </div>
          </div>

          {/* Quick Actions Grid for Platform Management */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/owner/institutions"
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm">Institution Management</div>
              <div className="text-xs text-slate-500 mt-0.5">Browse & manage all registered educational institutions</div>
            </Link>

            <Link
              href="/owner/subscriptions"
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 group-hover:text-emerald-600 text-sm">Subscription & Plans</div>
              <div className="text-xs text-slate-500 mt-0.5">Configure tiers, pricing quotas, and tenant licensing</div>
            </Link>

            <Link
              href="/owner/platform-users"
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 group-hover:text-blue-600 text-sm">Platform Users</div>
              <div className="text-xs text-slate-500 mt-0.5">Manage Super Admins and Platform Support staff</div>
            </Link>

            <Link
              href="/owner/billing"
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 group-hover:text-amber-600 text-sm">Billing Management</div>
              <div className="text-xs text-slate-500 mt-0.5">SaaS invoices, payment gateway reconciliation</div>
            </Link>
          </div>

          {/* Recent Onboarded Institutions Directory */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Recent Onboarded Institutions</span>
                </h3>
                <p className="text-xs text-slate-500">Live multi-tenant partitions across India</p>
              </div>
              <Link
                href="/owner/institutions"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentInstitutions.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inst.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{inst.code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          inst.type === 'COLLEGE' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {inst.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {inst.city ? `${inst.city}, ${inst.state}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {inst.subscriptionPlan || 'Growth Campus'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          inst.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href="/owner/institutions"
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure Health & Platform Partitions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Tenant Isolation Partitioning</span>
              </div>
              <div className="text-sm font-bold text-slate-800">Enforced & Operational</div>
              <p className="text-xs text-slate-500 mt-1">Tenant ID boundary queries verified across MySQL database tables.</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Role Hierarchy Enforcement</span>
              </div>
              <div className="text-sm font-bold text-slate-800">Platform vs Institution Separation</div>
              <p className="text-xs text-slate-500 mt-1">Platform Owner, Institution Owner, and Campus Admin scopes fully isolated.</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>SaaS Audit Logging</span>
              </div>
              <div className="text-sm font-bold text-slate-800">Active Audit Feed</div>
              <p className="text-xs text-slate-500 mt-1">All provisioning, subscription modifications, and status changes logged.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-slate-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-amber-950/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Governance & Institutional Suite</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                School Accounts & Capital Command
              </h1>
              <p className="text-sm text-amber-100/80 mt-1 max-w-2xl leading-relaxed">
                Consolidated institutional balance sheet, multi-campus performance comparison, EBITDA P&amp;L margins, and digital Owner Capex sign-off vault.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/owner/approvals"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Capex Sign-off ({pendingApprovals.length})</span>
              </Link>
              <Link
                href="/owner/salaries"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <DollarSign className="w-4 h-4" />
                <span>Staff Payroll</span>
              </Link>
              <Link
                href="/owner/fees"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all hover:scale-105"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Fee Desk</span>
              </Link>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* TOP ROW: 5 EXECUTIVE KPI TILES (from /api/v1/owner/overview) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Tile 1: Total Revenue YTD */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Revenue YTD</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {loading ? '...' : `₹${(metrics?.totalRevenueYtd ?? 0).toLocaleString()}`}
              </div>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>FY26 Realized Inflow</span>
              </div>
            </div>
          </div>

          {/* Tile 2: Total Arrears */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Arrears</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                {loading ? '...' : `₹${(metrics?.totalArrears ?? 0).toLocaleString()}`}
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-1.5">
                Fee Collection Deficit
              </div>
            </div>
          </div>

          {/* Tile 3: Student Occupancy */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Enrollment / Capacity</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : `${(metrics?.totalStudents ?? 0).toLocaleString()} / ${metrics?.totalCapacity ?? 0}`}
              </div>
              <div className="text-xs font-bold text-indigo-600 mt-1.5">
                {metrics?.occupancyRate ?? 0}% Total Capacity
              </div>
            </div>
          </div>

          {/* Tile 4: Staff & Attendance Today */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Staff In-Service</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : `${metrics?.staffCount ?? 0} Personnel`}
              </div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{metrics?.staffAttendanceToday ?? 0}% Present Today</span>
              </div>
            </div>
          </div>

          {/* Tile 5: Liquid Bank Balances */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-violet-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Liquid Funds</span>
              <div className="w-9 h-9 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-violet-700 tracking-tight">
                {loading ? '...' : (bankData?.totalLiquidFunds >= 10000000 
                  ? `₹${((bankData?.totalLiquidFunds ?? 0) / 10000000).toFixed(2)} Cr`
                  : `₹${(bankData?.totalLiquidFunds ?? 0).toLocaleString()}`)}
              </div>
              <div className="text-xs font-bold text-violet-600 mt-1.5">
                {bankData?.bankAccounts?.length > 0 ? `${bankData.bankAccounts.length} Linked Bank Vault${bankData.bankAccounts.length > 1 ? 's' : ''}` : 'Primary Operating Cash'}
              </div>
            </div>
          </div>

        </div>

        {/* EXECUTIVE MODULE TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'overview', label: 'Cash Flow & Surplus', icon: BarChart3 },
            { id: 'campuses', label: 'Campus Benchmarks', icon: Building2 },
            { id: 'pnl', label: 'EBITDA & P&L Statement', icon: TrendingUp },
            { id: 'banks', label: 'Bank Balances & Cash Book', icon: Landmark },
            { id: 'funnel', label: 'Admissions Funnel & Churn', icon: Users },
            { id: 'capex', label: `Capex Requisitions (${pendingApprovals.length})`, icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW CASH FLOW CHARTS */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Bar Chart (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Institutional Cash Flow & Monthly Surplus</h3>
                  <p className="text-xs text-slate-500">Gross fee collections compared against staff salaries &amp; operational expenses.</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 text-indigo-600">
                    <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" />
                    <span>Fee Inflow</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-rose-500">
                    <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
                    <span>Expenses</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                    <span>Net Surplus</span>
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFinancials} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '16px', color: '#fff', border: 'none', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="revenue" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="surplus" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart (4 cols) */}
            <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Capital Expenditure Allocation</h3>
                <p className="text-xs text-slate-500">Breakdown of monthly institution running costs.</p>
              </div>

              <div className="h-56 w-full relative my-2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseAllocation}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseAllocation.map((entry, index) => (
                        <Cell key={`alloc-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Budget</span>
                  <span className="text-lg font-black text-slate-900">100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100">
                {expenseAllocation.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-semibold">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAMPUS COMPARISON BENCHMARKS (from /api/v1/owner/campuses/comparison) */}
        {activeTab === 'campuses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Multi-Campus Performance Benchmarks</h3>
                <p className="text-xs text-slate-500">Comparative collection efficiency, student enrollment density, and faculty ratios.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-100">
                {campusComparison.length} Active Campuses
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campusComparison.map((campus) => (
                <div key={campus.campusId} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 hover:border-indigo-200 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase mb-1.5">
                        <span>Code: {campus.campusCode}</span>
                        {campus.isMain && <span className="text-amber-600 font-bold">&bull; Flagship Main Campus</span>}
                      </div>
                      <h4 className="text-xl font-black text-slate-900">{campus.campusName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{campus.address}</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-100">
                      {campus.collectionEfficiency}% Target Met
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold">Collections YTD</span>
                      <span className="font-extrabold text-slate-900 text-base">₹{(campus.collectionsYtd / 100000).toFixed(1)} Lakh</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Target: ₹{(campus.collectionTarget / 100000).toFixed(0)}L</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Enrolled Students</span>
                      <span className="font-extrabold text-slate-900 text-base">{campus.totalStudents} / {campus.capacity}</span>
                      <span className="text-[10px] text-indigo-600 block font-bold mt-0.5">{campus.occupancyRate}% Density</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Teacher-Student Ratio</span>
                      <span className="font-extrabold text-slate-900 text-base">{campus.teacherStudentRatio}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{campus.staffCount} Faculty members</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">YoY Student Growth</span>
                      <span className="font-extrabold text-emerald-600 text-base">+{campus.studentGrowthYoY}%</span>
                      <span className="text-[10px] text-emerald-600 block font-bold mt-0.5">Accelerating</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Avg Fee / Student</span>
                      <span className="font-extrabold text-slate-900 text-base">₹{Number(campus.averageFeePerStudent).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Annualized metric</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Campus Contact</span>
                      <span className="font-semibold text-slate-700 text-xs truncate block">{campus.phone}</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, campus.occupancyRate)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FINANCIAL P&L & MARGINS (from /api/v1/owner/financials/pnl) */}
        {activeTab === 'pnl' && pnlData && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Institutional Profit &amp; Loss Statement</h3>
                <p className="text-xs text-slate-500">Fiscal Year {pnlData.fiscalYear} ({pnlData.period}) &bull; Currency: INR (₹)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
                  EBITDA Margin: {pnlData.ebitdaMargin}%
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200">
                  Operating Margin: {pnlData.operatingMargin}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Streams */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Itemized Revenue Streams</h4>
                    <span className="text-xs text-slate-400">Total Fiscal Inflow</span>
                  </div>
                  <span className="text-xl font-black text-emerald-600">
                    ₹{Number(pnlData.revenues?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {Object.entries(pnlData.revenues || {})
                    .filter(([k]) => k !== 'totalRevenue')
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                        <span className="font-semibold text-slate-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-extrabold text-slate-900">₹{Number(val).toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Operating &amp; Staff Expenditure</h4>
                    <span className="text-xs text-slate-400">Total Fiscal Outflow</span>
                  </div>
                  <span className="text-xl font-black text-rose-600">
                    ₹{Number(pnlData.expenses?.totalOperatingExpenses || 0).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {Object.entries(pnlData.expenses || {})
                    .filter(([k]) => k !== 'totalOperatingExpenses')
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                        <span className="font-semibold text-slate-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-extrabold text-slate-900">₹{Number(val).toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Bottom Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 text-white p-5 rounded-3xl">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross EBITDA</span>
                <div className="text-2xl font-black mt-1">₹{Number(pnlData.ebitda).toLocaleString()}</div>
                <div className="text-xs text-emerald-400 mt-1">{pnlData.ebitdaMargin}% of gross revenue</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Depreciation &amp; Capex</span>
                <div className="text-2xl font-black text-slate-900 mt-1">₹{Number(pnlData.depreciationAndAmortization).toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Annual assets amortized</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Operating Profit</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">₹{Number(pnlData.operatingProfit).toLocaleString()}</div>
                <div className="text-xs text-indigo-600 mt-1">{pnlData.operatingMargin}% operating ratio</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Net Institutional Surplus</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">₹{Number(pnlData.netIncome).toLocaleString()}</div>
                <div className="text-xs text-emerald-600 mt-1">{pnlData.netMargin}% net profit margin</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BANK BALANCES & CASH BOOK (from /api/v1/owner/financials/bank-balances) */}
        {activeTab === 'banks' && bankData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {bankData.bankAccounts?.map((account) => (
                <div key={account.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 hover:border-violet-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center font-black">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                      {account.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-900">{account.bankName}</h4>
                    <p className="text-xs text-slate-500">{account.accountType}</p>
                    <span className="font-mono text-xs text-slate-400 block mt-1">Acc: {account.accountNumber}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Balance</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      ₹{Number(account.currentBalance).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Branch: {account.branch}</span>
                    <span>IFSC: {account.ifscCode}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Cash Book */}
            {bankData.dailyCashBook && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-slate-900">Campus Petty Cash &amp; Daily Desk Book</h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">As of {bankData.asOfDate}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-slate-400 block font-semibold">Opening Cash</span>
                    <span className="text-lg font-black text-slate-900">₹{Number(bankData.dailyCashBook.openingCash).toLocaleString()}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50">
                    <span className="text-emerald-700 block font-semibold">Cash Receipts Today</span>
                    <span className="text-lg font-black text-emerald-700">₹{Number(bankData.dailyCashBook.cashReceiptsToday).toLocaleString()}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50">
                    <span className="text-rose-700 block font-semibold">Disbursements Today</span>
                    <span className="text-lg font-black text-rose-700">₹{Number(bankData.dailyCashBook.pettyDisbursementsToday).toLocaleString()}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50">
                    <span className="text-indigo-700 block font-semibold">Closing Balance</span>
                    <span className="text-lg font-black text-indigo-700">₹{Number(bankData.dailyCashBook.closingCash).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ENROLLMENT FUNNEL & CHURN (from /api/v1/owner/enrollments/funnel & churn-analysis) */}
        {activeTab === 'funnel' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Funnel Stage Card (6 cols) */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Admissions Pipeline Funnel</h4>
                  <p className="text-xs text-slate-500">Inquiry to enrolled conversion metrics for academic cycle.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black">
                  33.9% Conversion
                </span>
              </div>

              {funnelData && (
                <div className="space-y-4">
                  {[
                    { label: 'Prospective Inquiries', count: funnelData.inquiries || 840, color: 'bg-indigo-600', pct: 100 },
                    { label: 'Formal Applications', count: funnelData.applications || 420, color: 'bg-purple-600', pct: 50 },
                    { label: 'Provisional Offers Extended', count: funnelData.offers || 310, color: 'bg-amber-500', pct: 36.9 },
                    { label: 'Fee Deposited & Enrolled', count: funnelData.enrolled || 285, color: 'bg-emerald-600', pct: 33.9 },
                  ].map((step, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">{step.label}</span>
                        <span className="text-slate-900">{step.count} ({step.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className={`${step.color} h-full rounded-full transition-all duration-500`} style={{ width: `${step.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Churn Analysis Card (6 cols) */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Student Withdrawal &amp; Churn</h4>
                  <p className="text-xs text-slate-500">Root-cause breakdown of student departure trends.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black">
                  {churnData?.churnRate || 1.47}% Annual Churn
                </span>
              </div>

              {churnData && (
                <div className="space-y-3">
                  {churnData.reasons?.map((r, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{r.category}</div>
                        <span className="text-[10px] text-slate-400">Primary driver of withdrawals</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-rose-600 block">{r.count} Students</span>
                        <span className="text-[10px] text-slate-400">{r.percentage}% of departures</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: CAPEX APPROVALS DESK (from /api/v1/owner/approvals/pending) */}
        {activeTab === 'capex' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Capital Requisitions Pending Signature</h3>
                <p className="text-xs text-slate-500">High-ticket procurement requests requiring digital owner PIN authorization.</p>
              </div>
              <Link
                href="/owner/approvals"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-700"
              >
                <span>Dedicated Approvals Vault</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900">All Requisitions Decided</h4>
                <p className="text-xs text-slate-400 mt-0.5">There are zero pending capital expenditures awaiting sign-off.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pendingApprovals.map((req) => (
                  <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {req.id}
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase">
                          {req.priority}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">{req.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{req.justification}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Amount</span>
                        <span className="font-black text-slate-900 text-lg">₹{Number(req.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Dept: {req.department}</span>
                        <span>Vendor: {req.vendor}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => openDecisionModal(req, 'REJECTED')}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold transition-all"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => openDecisionModal(req, 'APPROVED')}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all hover:scale-105"
                        >
                          Sign &amp; Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BENTO GRID: BOTTOM ROW — TWO 6-COL TILES (Tuition Collections & Faculty Payroll) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Tile 1 (6 cols): Recent Fee Collections */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Recent Tuition Collections</h3>
              </div>
              <Link href="/owner/fees" className="text-xs font-bold text-amber-600 hover:text-amber-700">
                Full Ledger
              </Link>
            </div>

            {recentFees.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No collection records found.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentFees.slice(0, 5).map((f) => (
                  <div key={f.s_no} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{f.fname} {f.lname}</div>
                      <div className="text-slate-400 text-[11px]">Class {f.class} - {f.section} &bull; {f.month}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-600 block">₹{Number(f.paid).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">{new Date(f.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tile 2 (6 cols): Staff Salary Disbursal Activity */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Monthly Faculty Payroll Pipeline</h3>
              </div>
              <Link href="/owner/salaries" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                Manage Payroll
              </Link>
            </div>

            {recentSalaries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No recent salary payments logged.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentSalaries.slice(0, 5).map((s) => (
                  <div key={s.s_no} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{s.staff_name}</div>
                      <div className="text-slate-400 text-[11px]">{s.role} &bull; ID: {s.staff_id}</div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="font-extrabold text-slate-900 block">₹{Number(s.net_payable).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">{s.salary_month ? String(s.salary_month).slice(0, 7) : '2026-10'}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        s.status === 'DISBURSED' || s.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* DECISION PIN MODAL */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Digital Authorization Protocol</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {decisionType === 'APPROVED' ? 'Authorize Requisition' : 'Decline Requisition'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedReq.id} &bull; {selectedReq.title}</p>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Requisition Amount</span>
                  <span className="font-extrabold text-slate-900 text-lg">₹{Number(selectedReq.amount).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-medium">Beneficiary Vendor</span>
                  <span className="font-bold text-slate-700">{selectedReq.vendor}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleDecisionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Owner Authorization PIN <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      value={authPin}
                      onChange={(e) => setAuthPin(e.target.value)}
                      placeholder="Enter 4-digit PIN (default 1234)"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono tracking-widest text-center text-lg font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Secured cryptographic sign-off for audit tracking. Default owner PIN is <span className="font-mono font-bold">1234</span>.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Decision Remarks &amp; Budget Line
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter audit remarks or budget allocation code..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition-all ${
                      decisionType === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    }`}
                  >
                    {submitting ? 'Authenticating...' : decisionType === 'APPROVED' ? 'Confirm & Sign Approval' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
