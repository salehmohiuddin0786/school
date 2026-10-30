'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Search, 
  Calendar, 
  Printer, 
  X, 
  Building2, 
  CheckCheck, 
  Send, 
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function OwnerSalariesPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const loadPayroll = () => {
    setLoading(true);
    fetch(`/api/owner/salaries?month=${month}`)
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setRecords(d.records || []);
          setSummary(d.summary || {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPayroll();
  }, [month]);

  // Handle Approve Single
  const handleApprove = async (staffId) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/owner/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_single', staff_id: staffId, month }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Payroll record approved.');
        setTimeout(() => setMessage(''), 3000);
        loadPayroll();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Approve All
  const handleApproveAll = async () => {
    if (!window.confirm(`Approve monthly payroll for all faculty members for ${month}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/owner/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_all', month }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('All payroll records approved successfully!');
        setTimeout(() => setMessage(''), 3000);
        loadPayroll();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Disburse Single
  const handleDisburse = async (staffId) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/owner/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disburse_single', staff_id: staffId, month }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Salary disbursement logged.');
        setTimeout(() => setMessage(''), 3000);
        loadPayroll();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Disburse All
  const handleDisburseAll = async () => {
    if (!window.confirm(`Mark salary disbursement as complete for all approved staff for ${month}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/owner/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disburse_all', month }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Full payroll disbursement completed.');
        setTimeout(() => setMessage(''), 3000);
        loadPayroll();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRecords = records.filter(r => 
    `${r.staff_name} ${r.subject || ''} ${r.staff_id}`.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Executive Payroll & Attendance-Based Salaries
            </h2>
            <p className="text-sm text-slate-500">
              Calculate salaries using attendance records, approve disbursements, and issue official payslips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={actionLoading || records.length === 0}
              onClick={handleApproveAll}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All Payroll</span>
            </button>
            <button
              disabled={actionLoading || records.length === 0}
              onClick={handleDisburseAll}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>Disburse Approved</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* 4 SUMMARY STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Net Payroll</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{(summary.total_payroll || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Monthly wage obligation</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Approved Rosters</span>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {summary.approved_count || 0} / {summary.total_staff || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">Ready for payment release</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Disbursed Staff</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {summary.disbursed_count || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">Transferred via bank</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Headcount</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {summary.total_staff || 0} Members
            </div>
            <div className="text-xs text-slate-500 mt-1">Active staff registry</div>
          </div>
        </div>

        {/* Filter bar: Month & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase">Salary Month</label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="font-bold text-slate-800 text-sm outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty name, subject, or staff ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Computing attendance-based payroll...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No staff payroll records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Staff Member</th>
                    <th className="py-4 px-6">Basic Salary</th>
                    <th className="py-4 px-6">Working / Payable Days</th>
                    <th className="py-4 px-6">Allowances / Deductions</th>
                    <th className="py-4 px-6">Net Payable</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredRecords.map((r) => {
                    const isDraft = r.status === 'DRAFT';
                    const isApproved = r.status === 'APPROVED';
                    const isDisbursed = r.status === 'DISBURSED';

                    return (
                      <tr key={r.staff_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{r.staff_name}</div>
                          <div className="text-xs text-slate-400 font-mono">{r.staff_id} · {r.subject || 'Faculty'}</div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          ₹{r.basic_salary.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-xs">
                          <div className="font-bold text-slate-900">
                            {r.payable_days} / {r.working_days} Days
                          </div>
                          <div className="text-slate-400 mt-0.5">
                            Attended: {r.attendance_days} · Paid Leave: {r.approved_leave_days} · LOP: {r.lop_days}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs">
                          <div className="text-emerald-600 font-semibold">+₹{r.allowances.toLocaleString()} Allow.</div>
                          <div className="text-rose-500 font-semibold">-₹{r.total_deduction.toLocaleString()} Deduct.</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-slate-900 text-base">
                            ₹{r.net_payable.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            isDisbursed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isApproved
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Workflow button */}
                            {isDraft && (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleApprove(r.staff_id)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all"
                              >
                                Approve
                              </button>
                            )}
                            {isApproved && (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleDisburse(r.staff_id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all"
                              >
                                Disburse
                              </button>
                            )}

                            {/* View Payslip Button */}
                            <button
                              title="Generate Payslip"
                              onClick={() => setSelectedPayslip(r)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* OFFICIAL DIGITAL PAYSLIP MODAL */}
        {selectedPayslip && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">Official Monthly Payslip Voucher</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Payslip</span>
                  </button>
                  <button onClick={() => setSelectedPayslip(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Payslip Sheet */}
              <div id="printable-payslip" className="border-2 border-slate-800 p-6 rounded-2xl space-y-6 text-xs text-slate-800">
                <div className="text-center pb-4 border-b-2 border-slate-800">
                  <h1 className="text-xl font-black text-slate-900 uppercase">SchoolNext ERP Institution</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Faculty & Staff Compensation Salary Statement</p>
                  <div className="text-xs font-bold text-indigo-900 mt-2">
                    Pay Period: {month} · Status: {selectedPayslip.status}
                  </div>
                </div>

                {/* Employee Info Header */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div><strong>Employee Name:</strong> {selectedPayslip.staff_name}</div>
                    <div><strong>Staff ID:</strong> {selectedPayslip.staff_id}</div>
                    <div><strong>Department / Subject:</strong> {selectedPayslip.subject || 'Faculty'}</div>
                  </div>
                  <div>
                    <div><strong>Total Days in Month:</strong> {selectedPayslip.working_days} Days</div>
                    <div><strong>Payable Days:</strong> {selectedPayslip.payable_days} Days</div>
                    <div><strong>Loss of Pay (LOP) Days:</strong> {selectedPayslip.lop_days} Days</div>
                  </div>
                </div>

                {/* Earnings & Deductions Table */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                    <span className="font-bold text-emerald-800 uppercase block border-b border-slate-200 pb-1">Earnings</span>
                    <div className="flex justify-between">
                      <span>Basic Salary (Base):</span>
                      <span className="font-mono">₹{selectedPayslip.basic_salary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Earned Basic (Attendance-Adj.):</span>
                      <span className="font-mono font-semibold">
                        ₹{Math.round(selectedPayslip.basic_salary * (selectedPayslip.payable_days / selectedPayslip.working_days)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Allowances:</span>
                      <span className="font-mono text-emerald-700">+₹{selectedPayslip.allowances.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                    <span className="font-bold text-rose-800 uppercase block border-b border-slate-200 pb-1">Deductions</span>
                    <div className="flex justify-between">
                      <span>Attendance LOP Deduction:</span>
                      <span className="font-mono text-rose-600">
                        -₹{Math.round(selectedPayslip.basic_salary * (selectedPayslip.lop_days / selectedPayslip.working_days)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standard Deductions / Taxes:</span>
                      <span className="font-mono text-rose-600">-₹{selectedPayslip.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-slate-100">
                      <span>Total Deductions:</span>
                      <span className="font-mono text-rose-700">₹{selectedPayslip.total_deduction.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Net Payable Highlight */}
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Disbursable Amount</span>
                    <span className="text-2xl font-black">₹{selectedPayslip.net_payable.toLocaleString()}</span>
                  </div>
                  <div className="text-right text-[11px] text-slate-300">
                    <span>Payment Mode: {selectedPayslip.payment_method}</span>
                    <span className="block mt-0.5">Authorization: Verified by Owner</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-300 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                    <span className="block font-bold">Confidential Document</span>
                    <span>System generated voucher under SchoolNext ERP</span>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-slate-400 w-32 mb-1"></div>
                    <span>Managing Director / School Owner</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end print:hidden">
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
