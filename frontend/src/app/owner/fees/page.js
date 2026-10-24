'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function OwnerFeesPage() {
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

  const recentFees = data?.recentFees || [];

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Fee Collections</h2>
            <p className="text-sm text-slate-500">Student tuition collections, outstanding balances, and defaulter tracking.</p>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Student Tuition Records</h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Live Transactions
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading ledger...</div>
          ) : recentFees.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No transactions recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Student</th>
                    <th className="py-4 px-6">Class</th>
                    <th className="py-4 px-6">Month</th>
                    <th className="py-4 px-6">Total Billed</th>
                    <th className="py-4 px-6 text-emerald-600">Paid</th>
                    <th className="py-4 px-6 text-rose-600">Balance</th>
                    <th className="py-4 px-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentFees.map(f => (
                    <tr key={f.s_no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {f.fname} {f.lname}
                        <div className="text-xs font-mono text-slate-400 font-normal">{f.student_id}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        Class {f.class} - {f.section}
                      </td>
                      <td className="py-4 px-6">{f.month}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800">₹{f.total?.toLocaleString() || 0}</td>
                      <td className="py-4 px-6 font-bold text-emerald-600">₹{f.paid?.toLocaleString() || 0}</td>
                      <td className="py-4 px-6 font-bold text-rose-600">₹{f.balance?.toLocaleString() || 0}</td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(f.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
