'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { DollarSign, Users, CheckCircle2, Search, Calendar } from 'lucide-react';

export default function OwnerSalariesPage() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/teachers')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setTeachers(d.teachers || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredTeachers = teachers.filter(t => 
    `${t.fname} ${t.lname} ${t.subject}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Payroll & Salaries</h2>
            <p className="text-sm text-slate-500">Executive disbursement and monthly salary ledger for school faculty.</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty payroll records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Salary Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading payroll...</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No faculty records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Faculty Member</th>
                    <th className="py-4 px-6">Subject / Role</th>
                    <th className="py-4 px-6">Monthly Salary</th>
                    <th className="py-4 px-6">Payment Mode</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredTeachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {t.fname} {t.lname}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {t.subject || 'Faculty'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        ₹{t.salary ? Number(t.salary).toLocaleString() : '35,000'}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        Direct Bank Transfer
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Disbursed</span>
                        </span>
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
