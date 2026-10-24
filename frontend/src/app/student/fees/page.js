'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Receipt 
} from 'lucide-react';

export default function StudentFeesPage() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setFees(d.fees || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalBilled = fees.reduce((acc, c) => acc + (c.total || 0), 0);
  const totalPaid = fees.reduce((acc, c) => acc + (c.paid || 0), 0);
  const totalBalance = fees.reduce((acc, c) => acc + (c.balance || 0), 0);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tuition & Fee Records</h2>
          <p className="text-sm text-slate-500">Track tuition installments, payment receipts, and balance dues.</p>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Academic tuition & collections</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Paid</span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">₹{totalPaid.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Cleared installments</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Outstanding Due</span>
            <div className={`text-3xl font-extrabold mt-1 ${totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₹{totalBalance.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Current pending amount</div>
          </div>
        </div>

        {/* Fees Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-slate-900">Fee Invoices & Receipts</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {fees.length} Invoices
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading fee records...</div>
          ) : fees.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No fee records found for this student.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Billing Month</th>
                    <th className="py-4 px-6">Total Billed</th>
                    <th className="py-4 px-6 text-emerald-600">Paid Amount</th>
                    <th className="py-4 px-6 text-rose-600">Balance Due</th>
                    <th className="py-4 px-6 text-center">Payment Status</th>
                    <th className="py-4 px-6">Recorded Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {fees.map((f) => {
                    const isPaid = (f.balance || 0) <= 0;
                    return (
                      <tr key={f.s_no} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">{f.month}</td>
                        <td className="py-4 px-6 font-semibold text-slate-800">₹{f.total?.toLocaleString() || 0}</td>
                        <td className="py-4 px-6 font-bold text-emerald-600">₹{f.paid?.toLocaleString() || 0}</td>
                        <td className="py-4 px-6 font-bold text-rose-600">₹{f.balance?.toLocaleString() || 0}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isPaid ? 'Paid in Full' : 'Due Balance'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400">
                          {new Date(f.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
