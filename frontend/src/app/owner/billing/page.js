'use client';
import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  DollarSign,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Calendar,
  ExternalLink
} from 'lucide-react';

export default function BillingManagementPage() {
  const invoices = [
    {
      id: 'INV-2026-001',
      institution: 'Greenwood International School',
      plan: 'Growth Campus',
      amount: 6999,
      date: '2026-10-24',
      status: 'PAID',
      method: 'Razorpay Auto-Debit'
    },
    {
      id: 'INV-2026-002',
      institution: 'Springfield College',
      plan: 'Starter School',
      amount: 2499,
      date: '2026-10-24',
      status: 'PAID',
      method: 'NetBanking'
    },
    {
      id: 'INV-2026-003',
      institution: "St. Xavier's High School",
      plan: 'Starter School',
      amount: 2499,
      date: '2026-10-24',
      status: 'PAID',
      method: 'UPI Mandate'
    },
    {
      id: 'INV-2026-004',
      institution: 'Horizon Institute of Technology',
      plan: 'Enterprise Multi-Campus',
      amount: 14999,
      date: '2026-11-02',
      status: 'PAID',
      method: 'Wire Transfer'
    },
  ];

  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3 uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5" /> SaaS Billing & Invoicing
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Platform Billing Management
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Recurring platform subscription revenue, automated invoice generation for institutions, and gateway settlement logs.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total SaaS Billing YTD</div>
            <div className="text-2xl font-black text-slate-900 mt-2">₹{totalCollected.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% On-time Realization</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Billing Mandates</div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{invoices.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Direct debit e-mandates active</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Payment Gateway Health</div>
            <div className="text-2xl font-black text-indigo-600 mt-2">Active</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-1">Razorpay & Stripe Webhooks 200 OK</div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>SaaS Subscription Invoices ({invoices.length})</span>
            </h3>
            <button
              onClick={() => alert('Exporting SaaS invoices CSV...')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Invoice ID</th>
                  <th className="py-3.5 px-4">Institution</th>
                  <th className="py-3.5 px-4">Subscription Plan</th>
                  <th className="py-3.5 px-4">Billed Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-indigo-600">{inv.id}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{inv.institution}</td>
                    <td className="py-4 px-4 text-slate-700">{inv.plan}</td>
                    <td className="py-4 px-4 font-black text-slate-900">₹{inv.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-500">{inv.method}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
