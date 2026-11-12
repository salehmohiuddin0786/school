'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users,
  ShieldCheck,
  PlusCircle,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';

export default function PlatformUsersPage() {
  const [users, setUsers] = useState([
    {
      id: 'usr-1',
      name: 'Platform Super Admin',
      email: 'superadmin@schoolnext.internal',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      lastLogin: 'Today, 21:30',
      mfaEnabled: true,
    },
    {
      id: 'usr-2',
      name: 'Platform Operations Admin',
      email: 'ops@schoolnext.internal',
      role: 'OPERATIONS_ADMIN',
      status: 'ACTIVE',
      lastLogin: 'Yesterday, 14:15',
      mfaEnabled: true,
    },
    {
      id: 'usr-3',
      name: 'Platform Finance Lead',
      email: 'finance@schoolnext.internal',
      role: 'FINANCE_ADMIN',
      status: 'ACTIVE',
      lastLogin: 'Oct 28, 2026',
      mfaEnabled: true,
    },
  ]);

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Platform Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Platform Users & Super Admins
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Manage internal Platform Operations Admins, SaaS Support Agents, and Finance Officers with access to multi-tenant platform infrastructure.
            </p>
          </div>

          <button
            onClick={() => alert('Platform User invitation modal initialized.')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Platform Admin</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Platform Administrators ({users.length})</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Tenant ID: NULL (Global Scope)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Platform Role</th>
                  <th className="py-3.5 px-4">MFA Security</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Lock className="w-3 h-3" /> Enabled
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {u.lastLogin}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> {u.status}
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
