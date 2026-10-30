'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CreditCard, 
  Receipt, 
  Printer, 
  X, 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function ParentFeesPage() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetch('/api/parent/children')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success' && d.children?.length > 0) {
          setChildren(d.children);
          setSelectedChildId(d.children[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchFees(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchFees = async (childId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/fees?studentId=${childId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setFeeData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];
  const invoices = feeData?.invoices || [];
  const student = feeData?.student;

  const totalBilled = invoices.reduce((acc, c) => acc + (c.total || 0), 0);
  const totalPaid = invoices.reduce((acc, c) => acc + (c.paid || 0), 0);
  const totalBalance = invoices.reduce((acc, c) => acc + (c.balance || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header & Child Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1">
              <Link href="/parent" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Parent Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-500">Fees & Invoices</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tuition Fees & Invoices
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Billing breakdown, installment records, balance status, and official PDF receipts for {selectedChild?.name}.
            </p>
          </div>

          {children.length > 0 && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
              <select
                value={selectedChildId || ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 pr-4 py-1 outline-none"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.class}-{c.section})
                  </option>
                ))}
              </select>
            </div>
          )}
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

        {/* Invoices Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-sky-600" />
              <div>
                <h3 className="font-bold text-slate-900">Fee Invoices & Receipts</h3>
                <p className="text-xs text-slate-400">Official fee ledger with printable invoices</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading invoice records...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No fee records found for this student.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Invoice No</th>
                    <th className="py-4 px-6">Total Billed</th>
                    <th className="py-4 px-6 text-emerald-600">Paid Amount</th>
                    <th className="py-4 px-6 text-rose-600">Balance Due</th>
                    <th className="py-4 px-6 text-center">Payment Status</th>
                    <th className="py-4 px-6">Due Date</th>
                    <th className="py-4 px-6 text-right">Invoice Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {invoices.map((inv) => {
                    const isPaid = (inv.balance || 0) <= 0 || inv.status === 'PAID';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          ₹{inv.total?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-6 font-bold text-emerald-600">
                          ₹{inv.paid?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-6 font-bold text-rose-600">
                          ₹{inv.balance?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            isPaid 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isPaid ? 'Paid in Full' : 'Due Balance'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {inv.dueDate}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>View / Print PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Printable Invoice Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 print:hidden">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Invoice Body */}
              <div id="printable-invoice" className="space-y-6 text-slate-900 p-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      {student?.institutionName || 'Greenwood International School'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      {student?.institutionAddress || '100 Campus Avenue, Institutional Area'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Affiliated & Recognized • Official Tuition Fee Invoice
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Invoice Number
                    </span>
                    <span className="text-lg font-mono font-extrabold text-slate-900">
                      {selectedInvoice.invoiceNumber}
                    </span>
                    <div className="text-xs text-slate-500 mt-1">
                      Due Date: <span className="font-semibold text-slate-800">{selectedInvoice.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Student Name</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedChild?.name || 'Student'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Admission / Roll</span>
                    <span className="font-bold font-mono text-slate-900">{selectedChild?.roll_no || 'STD-101'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Class & Section</span>
                    <span className="font-bold text-slate-900">{selectedChild?.class} ({selectedChild?.section})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      (selectedInvoice.balance || 0) <= 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {(selectedInvoice.balance || 0) <= 0 ? 'PAID IN FULL' : 'PAYMENT DUE'}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Fee Head / Description</th>
                        <th className="py-3 px-4 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(selectedInvoice.items || [
                        { description: 'Tuition Fee Component', amount: selectedInvoice.total * 0.75 },
                        { description: 'Activity & Lab Amenities', amount: selectedInvoice.total * 0.25 },
                      ]).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{item.description}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            ₹{Math.round(item.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-xs">
                      <tr>
                        <td colSpan="2" className="py-3 px-4 text-slate-700 uppercase">Total Invoice Amount</td>
                        <td className="py-3 px-4 text-right text-slate-900 text-sm">₹{selectedInvoice.total?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan="2" className="py-2.5 px-4 text-emerald-700 uppercase">Total Paid / Cleared</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700">₹{selectedInvoice.paid?.toLocaleString()}</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td colSpan="2" className="py-3 px-4 text-rose-700 uppercase">Net Outstanding Balance</td>
                        <td className="py-3 px-4 text-right text-rose-700 text-sm font-extrabold">₹{selectedInvoice.balance?.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-xs">
                  <div>
                    <p className="text-slate-400">Notice:</p>
                    <p className="text-slate-500 max-w-sm text-[11px] mt-0.5">
                      This is a computer-generated fee invoice issued under the authority of SchoolNext ERP. Late submissions are subject to institution policy.
                    </p>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="w-36 h-12 border-b-2 border-dashed border-slate-400 mx-auto sm:ml-auto"></div>
                    <span className="text-[11px] font-bold text-slate-700 mt-1 block">
                      Accounts Officer Signature
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
