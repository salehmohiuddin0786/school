'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Receipt, 
  X, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  DollarSign
} from 'lucide-react';

export default function StudentFeesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [payModal, setPayModal] = useState(null); // { type: 'INSTALLMENT' | 'FULL_BALANCE', amount: number }
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/fees');
      const json = await res.json();
      if (json.status === 'success') {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const invoices = data?.invoices || [];
  const receipts = data?.receipts || [];
  const student = data?.student;

  const totalBilled = invoices.reduce((acc, c) => acc + (c.total || 0), 0);
  const totalPaid = invoices.reduce((acc, c) => acc + (c.paid || 0), 0);
  const totalBalance = Math.max(0, invoices.reduce((acc, c) => acc + (c.balance || 0), 0));

  // Determine next installment
  const nextInstallmentAmount = totalBalance > 0 ? Math.min(10000, totalBalance) : 0;
  const nextDueDate = invoices[0]?.dueDate || '2026-11-15';

  const handleOpenPay = (type) => {
    const amount = type === 'FULL_BALANCE' ? totalBalance : nextInstallmentAmount;
    if (amount <= 0) return;
    setPayModal({ type, amount, invoiceId: invoices[0]?.id });
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payModal) return;
    setSubmittingPayment(true);
    try {
      const res = await fetch('/api/student/fees/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: payModal.type,
          amount: payModal.amount,
          paymentMethod,
          invoiceId: payModal.invoiceId,
        }),
      });
      const resData = await res.json();
      if (!res.ok || resData.status !== 'success') {
        throw new Error(resData.error || 'Payment failed');
      }

      setPayModal(null);
      setReceiptModal(resData.receipt);
      setMessage(`Payment of ₹${payModal.amount.toLocaleString()} cleared successfully!`);
      setTimeout(() => setMessage(''), 4000);
      fetchFees();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tuition Fees & Installment Payments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pay academic installments, view outstanding balances, and print verified fee receipts.
            </p>
          </div>
          <div className="bg-violet-50 text-violet-900 border border-violet-200/60 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs font-bold shadow-sm">
            <Receipt className="w-4 h-4 text-violet-600" />
            <span>Academic Year 2025-2026</span>
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Academic Fee</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Tuition & campus facilities</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Cleared</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalPaid.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Confirmed payments</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Outstanding Balance</span>
            <div className={`text-2xl font-extrabold mt-1 ${totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₹{totalBalance.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Pending dues</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Next Installment</span>
            <div className="text-2xl font-extrabold text-indigo-700 mt-1">
              ₹{nextInstallmentAmount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-semibold">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Due: {nextDueDate}</span>
            </div>
          </div>
        </div>

        {/* TWO PRIMARY PAYMENT ACTIONS */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
              Online Fee Settlement Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">Fast & Secure Installment Payments</h2>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
              Pay via UPI, debit card or net banking. Transactions are recorded instantly with immediate digital receipts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {/* ACTION 1: PAY NEXT INSTALLMENT */}
            <button
              disabled={totalBalance <= 0}
              onClick={() => handleOpenPay('INSTALLMENT')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Next Installment (₹{nextInstallmentAmount.toLocaleString()})</span>
            </button>

            {/* ACTION 2: PAY FULL OUTSTANDING BALANCE */}
            <button
              disabled={totalBalance <= 0}
              onClick={() => handleOpenPay('FULL_BALANCE')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Pay Full Outstanding Balance (₹{totalBalance.toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* INVOICES & DETAILED BREAKDOWN */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Academic Fee Breakdown</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Student ID: {student?.admissionNumber || student?.id || 'Active'}
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading fee ledger...</div>
          ) : invoices.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No active invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Invoice #</th>
                    <th className="py-4 px-6">Billing Period</th>
                    <th className="py-4 px-6">Total Billed</th>
                    <th className="py-4 px-6">Paid</th>
                    <th className="py-4 px-6">Balance Due</th>
                    <th className="py-4 px-6">Due Date</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-indigo-600 text-xs">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {inv.month || 'Academic Year 2026'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        ₹{inv.total.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-emerald-600 font-semibold">
                        ₹{inv.paid.toLocaleString()}
                      </td>
                      <td className={`py-4 px-6 font-bold ${inv.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{inv.balance.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {inv.dueDate}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAYMENT RECEIPTS HISTORY */}
        {receipts.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Verified Payment Receipts</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{receipts.length} Transactions</span>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              {receipts.map((rec) => (
                <div key={rec.receipt_no} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                  <div>
                    <div className="font-mono font-bold text-indigo-700 text-xs">{rec.receipt_no}</div>
                    <div className="font-extrabold text-slate-900 text-base mt-0.5">
                      ₹{Number(rec.amount_paid).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Method: {rec.payment_method}</span>
                      <span>·</span>
                      <span>{new Date(rec.payment_date).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setReceiptModal(rec)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all self-start sm:self-auto"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>View / Print Receipt</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENT MODAL */}
        {payModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">Confirm Online Payment</h3>
                </div>
                <button onClick={() => setPayModal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmPayment} className="space-y-4 text-sm">
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Payment Summary</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{payModal.amount.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {payModal.type === 'FULL_BALANCE' ? 'Full Outstanding Balance Clearance' : 'Tuition Fee Installment'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['UPI', 'NetBanking', 'Card'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          paymentMethod === m
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500">
                  Payment is processed securely. An official receipt will be generated and saved to your account immediately.
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPayModal(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 disabled:opacity-60"
                  >
                    {submittingPayment ? 'Processing...' : `Authorize ₹${payModal.amount.toLocaleString()}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* OFFICIAL DIGITAL RECEIPT MODAL */}
        {receiptModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">Official Payment Receipt</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button onClick={() => setReceiptModal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Voucher */}
              <div id="printable-receipt" className="border-2 border-slate-900 p-6 rounded-2xl space-y-4 text-xs text-slate-800">
                <div className="text-center pb-3 border-b border-slate-300">
                  <h2 className="text-lg font-black uppercase text-slate-900">SchoolNext ERP Academy</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Office of Fee Collection & Accounts</p>
                  <span className="inline-block mt-1 font-mono font-bold text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                    RECEIPT #{receiptModal.receipt_no}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><strong>Student Name:</strong> {student?.name || 'Enrolled Student'}</div>
                  <div><strong>Admission No:</strong> {student?.admissionNumber || student?.id || 'S101'}</div>
                  <div><strong>Class & Section:</strong> {student?.className || '10'} - {student?.sectionName || 'A'}</div>
                  <div><strong>Payment Date:</strong> {new Date(receiptModal.payment_date).toLocaleDateString()}</div>
                </div>

                <div className="py-2 border-y border-slate-300 space-y-1">
                  <div className="flex justify-between font-bold text-sm text-slate-900">
                    <span>Amount Paid:</span>
                    <span>₹{Number(receiptModal.amount_paid).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Payment Method:</span>
                    <span>{receiptModal.payment_method || 'Online'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Previous Outstanding:</span>
                    <span>₹{Number(receiptModal.previous_balance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Remaining Balance:</span>
                    <span>₹{Number(receiptModal.remaining_balance || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                    <span className="block font-bold text-emerald-700">STATUS: VERIFIED & CLEARED</span>
                    <span>Generated automatically via SchoolNext ERP</span>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-slate-400 w-24 mb-1"></div>
                    <span>Cashier / Bursar</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end print:hidden">
                <button
                  onClick={() => setReceiptModal(null)}
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
