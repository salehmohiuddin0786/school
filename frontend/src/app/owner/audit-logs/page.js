'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ShieldCheck,
  Clock,
  Building2,
  User,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([
    {
      id: 'log-1',
      action: 'TENANT_ONBOARDED',
      entity: 'TENANT',
      details: "Institution 'St. Mary Engineering College' onboarded with Starter Plan.",
      user: 'superadmin@schoolnext.internal',
      timestamp: '2026-11-02 20:53:16',
      status: 'SUCCESS'
    },
    {
      id: 'log-2',
      action: 'SUBSCRIPTION_UPGRADE',
      entity: 'SUBSCRIPTION',
      details: "Subscription upgraded to 'Growth Campus' with 3 months extension.",
      user: 'superadmin@schoolnext.internal',
      timestamp: '2026-11-02 20:53:18',
      status: 'SUCCESS'
    },
    {
      id: 'log-3',
      action: 'TENANT_SUSPENSION',
      entity: 'TENANT',
      details: "Institution 'Delhi Public Academy' status updated to SUSPENDED.",
      user: 'superadmin@schoolnext.internal',
      timestamp: '2026-11-02 20:52:16',
      status: 'SUCCESS'
    },
    {
      id: 'log-4',
      action: 'CAMPUS_CREATED',
      entity: 'CAMPUS',
      details: "New branch campus created for Greenwood International School.",
      user: 'owner@gmail.com',
      timestamp: '2026-11-02 21:37:31',
      status: 'SUCCESS'
    },
  ]);

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Immutable Security Logs
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Platform Audit Trail
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Cryptographically stamped logs tracking tenant creations, license upgrades, administrative role assignments, and security events across the SaaS platform.
          </p>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Real-Time Security Audit Feed</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{logs.length} Logged Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-mono text-slate-500">{l.timestamp}</td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">{l.entity}</td>
                    <td className="py-4 px-4 text-slate-600 max-w-md">{l.details}</td>
                    <td className="py-4 px-4 text-slate-500">{l.user}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> {l.status}
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
