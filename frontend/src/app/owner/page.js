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
  Wallet
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/accounts')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const metrics = data?.metrics || {};
  const recentFees = data?.recentFees || [];
  const recentSalaries = data?.recentSalaries || [];
  const monthlyFinancials = data?.monthlyFinancials || [];
  const expenseAllocation = data?.expenseAllocation || [];

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-slate-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-amber-950/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Institutional Oversight</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                School Accounts & Capital Overview
              </h1>
              <p className="text-sm text-amber-100/80 mt-1 max-w-xl leading-relaxed">
                Live institutional cash flows, student fee realization ratios, and attendance-governed faculty disbursements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/owner/salaries"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <DollarSign className="w-4 h-4" />
                <span>Staff Payroll Ledger</span>
              </Link>
              <Link
                href="/owner/fees"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all hover:scale-105"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Fee Collection Desk</span>
              </Link>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* BENTO GRID: TOP ROW — 4 FINANCIAL KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fee Revenue Cleared</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-emerald-600 tracking-tight">
                {loading ? '...' : `₹${(metrics.totalCollected || 0).toLocaleString()}`}
              </div>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-2">
                <TrendingUp className="w-3.5 h-3.5" /> Direct Bank Inflow
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full w-[82%]" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receivable Fee Assets</span>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-rose-600 tracking-tight">
                {loading ? '...' : `₹${(metrics.totalPending || 0).toLocaleString()}`}
              </div>
              <div className="text-xs font-bold text-slate-500 mt-2">
                Pending Tuition Installments
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full w-[18%]" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Payroll Disbursed</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '...' : `₹${(metrics.totalSalaries || 0).toLocaleString()}`}
              </div>
              <div className="text-xs font-bold text-indigo-600 mt-2">
                Monthly Staff Disbursals
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full w-[70%]" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Operating Surplus</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-3xl font-black tracking-tight ${metrics.netRevenue >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
                {loading ? '...' : `₹${(metrics.netRevenue || 0).toLocaleString()}`}
              </div>
              <div className="text-xs font-bold text-emerald-600 mt-2">
                Operational Capital Health
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full w-[90%]" />
            </div>
          </div>
        </div>

        {/* BENTO GRID: MIDDLE ROW — FINANCIAL RECHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Chart (8 cols): Revenue vs Expenses Comparative Bar Chart */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Institutional Cash Flow & Monthly Surplus</h3>
                <p className="text-xs text-slate-500">Gross fee collections compared against staff salaries & operational expenses.</p>
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

          {/* Donut Chart (4 cols): Budget & Expense Allocation */}
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

        {/* BENTO GRID: BOTTOM ROW — TWO 6-COL TILES */}
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
                {recentFees.map((f) => (
                  <div key={f.s_no} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{f.fname} {f.lname}</div>
                      <div className="text-slate-400 text-[11px]">Class {f.class} - {f.section} · {f.month}</div>
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
                {recentSalaries.map((s) => (
                  <div key={s.s_no} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{s.staff_name}</div>
                      <div className="text-slate-400 text-[11px]">{s.role} · ID: {s.staff_id}</div>
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

      </div>
    </DashboardLayout>
  );
}
