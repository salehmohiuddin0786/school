'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BarChart3,
  TrendingUp,
  School,
  Building2,
  Users,
  DollarSign,
  Download,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function PlatformReportsPage() {
  const mrrGrowthData = [
    { month: 'Jun', mrr: 12000, institutions: 2 },
    { month: 'Jul', mrr: 14500, institutions: 2 },
    { month: 'Aug', mrr: 19000, institutions: 3 },
    { month: 'Sep', mrr: 21500, institutions: 3 },
    { month: 'Oct', mrr: 26997, institutions: 4 },
    { month: 'Nov', mrr: 31996, institutions: 5 },
  ];

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" /> Platform Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Platform Analytics & Growth Reports
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cross-institution growth velocity, Monthly Recurring Revenue (MRR) expansion, student enrollment volume, and multi-tenant utilization.
            </p>
          </div>

          <button
            onClick={() => alert('Exporting platform growth report PDF...')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Analytics PDF</span>
          </button>
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">SaaS Revenue & Tenant Velocity</h3>
              <p className="text-xs text-slate-500">6-Month Platform MRR Growth in INR</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+38% MoM Growth</span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'MRR']} />
                <Bar dataKey="mrr" fill="#4F46E5" radius={[8, 8, 0, 0]} name="MRR (INR)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
