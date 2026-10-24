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
  CheckCircle2
} from 'lucide-react';

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

  return (
    <DashboardLayout role="owner">
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-amber-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-1">
              Executive Financial Control
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              School Accounts & Financial Overview
            </h2>
            <p className="text-sm text-amber-200 mt-1">
              Total tuition collected, staff salary disbursements, and institutional cash flow.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/owner/fees"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105"
            >
              <CreditCard className="w-4 h-4" />
              <span>Fee Collection Desk</span>
            </Link>
          </div>
        </div>

        {/* 4 Financial Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Fee Revenue</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {loading ? '...' : `₹${(metrics.totalCollected || 0).toLocaleString()}`}
            </div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> Cleared Payments
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Fees</span>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-rose-600">
              {loading ? '...' : `₹${(metrics.totalPending || 0).toLocaleString()}`}
            </div>
            <div className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-2">
              <TrendingDown className="w-3.5 h-3.5" /> Outstanding Balances
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Staff Salaries Paid</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-blue-600">
              {loading ? '...' : `₹${(metrics.totalSalaries || 0).toLocaleString()}`}
            </div>
            <div className="text-xs text-slate-500 mt-2">Disbursed payroll</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Operating Flow</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-3xl font-extrabold ${(metrics.netRevenue || 0) >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {loading ? '...' : `₹${(metrics.netRevenue || 0).toLocaleString()}`}
            </div>
            <div className="text-xs text-slate-500 mt-2">Collections less payroll</div>
          </div>
        </div>

        {/* Recent Transactions & Salaries Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recent Student Fee Transactions */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Recent Student Fee Receipts</h3>
                  <p className="text-xs text-slate-500">Live tuition payments</p>
                </div>
              </div>
              <Link href="/owner/fees" className="text-xs font-bold text-amber-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading fee records...</div>
            ) : recentFees.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No recent transactions.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {recentFees.map(f => (
                      <tr key={f.s_no} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {f.fname} {f.lname} ({f.class}-{f.section})
                        </td>
                        <td className="py-3 px-4">{f.month}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">₹{f.paid?.toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">₹{f.balance?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Salary Payments */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Recent Payroll</h3>
                  <p className="text-xs text-slate-500">Staff salary records</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading payroll...</div>
            ) : recentSalaries.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No payroll entries recorded.</div>
            ) : (
              <div className="space-y-3">
                {recentSalaries.map(s => (
                  <div key={s.s_no} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{s.staff_name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{s.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-blue-600">₹{parseFloat(s.amount).toLocaleString()}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
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
