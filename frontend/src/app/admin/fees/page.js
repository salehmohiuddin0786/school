'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CreditCard, 
  Search, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  X,
  FileText,
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function CashierPOSFeesPage() {
  const [invoices, setInvoices] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [metrics, setMetrics] = useState({ todayCollected: 0, cashInHand: 0, totalInvoicesCount: 0 });
  const [discountRules, setDiscountRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form states
  const [tenderAmount, setTenderAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [applyingSiblingDiscount, setApplyingSiblingDiscount] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Receipt Modal state
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [receiptFormat, setReceiptFormat] = useState('thermal'); // 'thermal' or 'a4'

  // Reversal Modal state
  const [reversalTarget, setReversalTarget] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversing, setReversing] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'cashbook', 'reversals'

  useEffect(() => {
    fetchFeesData();
  }, [search]);

  const fetchFeesData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/fees?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setInvoices(data.invoices || []);
        setRecentPayments(data.recentPayments || []);
        setMetrics(data.metrics || { todayCollected: 0, cashInHand: 0 });
        setDiscountRules(data.discountRules || []);
        if (data.invoices?.length > 0 && !selectedInvoice) {
          selectInvoiceForPayment(data.invoices[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load fees data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectInvoiceForPayment = (inv) => {
    setSelectedInvoice(inv);
    setTenderAmount(inv.balance > 0 ? String(inv.balance) : '0');
    setApplyingSiblingDiscount(false);
    setNotes('');
  };

  const calculateDiscountAmount = () => {
    if (!applyingSiblingDiscount || !selectedInvoice) return 0;
    // 20% concession on tuition head or base
    const tuitionLine = selectedInvoice.lines?.find(l => l.description.toLowerCase().includes('tuition'));
    const base = tuitionLine ? Number(tuitionLine.totalAmount) : Number(selectedInvoice.totalAmount);
    return Math.round((base * 20) / 100);
  };

  const discountAmount = calculateDiscountAmount();
  const effectivePayable = selectedInvoice ? Math.max(0, Number(selectedInvoice.balance) - discountAmount) : 0;

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const payVal = Number(tenderAmount);
    if (!payVal || payVal <= 0) {
      alert('Please enter a valid tender amount greater than 0.');
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.invoiceId,
          amount: payVal,
          paymentMethod,
          notes: notes + (applyingSiblingDiscount ? ' [Sibling 20% Concession Applied]' : ''),
          discountAmount,
        }),
      });

      const result = await res.json();
      if (res.ok && result.receipt) {
        setCompletedReceipt(result.receipt);
        fetchFeesData();
      } else {
        alert(result.error || 'Payment failed to record.');
      }
    } catch (err) {
      alert('Network error while recording payment: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReversalSubmit = async (e) => {
    e.preventDefault();
    if (!reversalTarget || !reversalReason.trim()) return;

    try {
      setReversing(true);
      const res = await fetch('/api/admin/fees/reversal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: reversalTarget.id,
          reason: reversalReason,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        alert(`Payment reversed successfully! Cancellation Voucher: ${result.reversalVoucherNo}`);
        setReversalTarget(null);
        setReversalReason('');
        fetchFeesData();
      } else {
        alert(result.error || 'Reversal failed.');
      }
    } catch (err) {
      alert('Network error during payment reversal.');
    } finally {
      setReversing(false);
    }
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Top Header & Day-End Balancing KPI Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-600 tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Cashier Operations & Financial Settlement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Fee Counter POS & Receipting
            </h1>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl px-4 py-2 text-right">
              <span className="text-xs font-semibold text-emerald-700 block">Today's Collections</span>
              <span className="text-lg font-extrabold text-emerald-900">₹{metrics.todayCollected?.toLocaleString()}</span>
            </div>
            <div className="bg-sky-50 border border-sky-200/60 rounded-2xl px-4 py-2 text-right">
              <span className="text-xs font-semibold text-sky-700 block">Cash in Drawer</span>
              <span className="text-lg font-extrabold text-sky-900">₹{metrics.cashInHand?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pos' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Cashier Counter POS
          </button>
          <button
            onClick={() => setActiveTab('cashbook')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'cashbook' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Day-End Cash Book & Ledger
          </button>
        </div>

        {activeTab === 'pos' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 5 Cols: Student Search & Invoice Directory */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm">
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by Admission # or Name..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Outstanding Invoices ({invoices.length})
                </div>

                {loading ? (
                  <div className="py-12 text-center text-sm text-slate-400">Loading student directory...</div>
                ) : invoices.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">No invoices found matching query.</div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
                    {invoices.map((inv) => (
                      <div
                        key={inv.invoiceId}
                        onClick={() => selectInvoiceForPayment(inv)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all ${
                          selectedInvoice?.invoiceId === inv.invoiceId
                            ? 'bg-emerald-50 border border-emerald-300/80 shadow-sm'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-slate-900 text-sm">{inv.studentName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{inv.admissionNumber} • {inv.classSection}</span>
                          <span className="font-bold text-slate-900">
                            Bal: <span className="text-rose-600 font-extrabold">₹{inv.balance?.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 7 Cols: POS Tender & Multi-Head Breakdown Desk */}
            <div className="lg:col-span-7 space-y-6">
              {selectedInvoice ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
                  
                  {/* Student Selected Header Card */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-lg">
                        {selectedInvoice.studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{selectedInvoice.studentName}</h3>
                        <p className="text-xs text-slate-500">
                          {selectedInvoice.admissionNumber} • {selectedInvoice.classSection} • {selectedInvoice.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono block">{selectedInvoice.invoiceNumber}</span>
                      <span className="text-xs font-semibold text-slate-500">Due: {selectedInvoice.dueDate?.split('T')[0]}</span>
                    </div>
                  </div>

                  {/* Multi-Head Line Items */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Head Fee Schedule</div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-sm">
                      {selectedInvoice.lines?.map((line) => (
                        <div key={line.id} className="flex justify-between items-center text-slate-700">
                          <span>{line.description}</span>
                          <span className="font-bold text-slate-900">₹{Number(line.totalAmount).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-base">
                        <span>Total Invoice Amount</span>
                        <span>₹{Number(selectedInvoice.totalAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Previously Cleared</span>
                        <span className="text-emerald-600 font-semibold">₹{Number(selectedInvoice.paidAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-rose-600">
                        <span>Remaining Outstanding Due</span>
                        <span>₹{Number(selectedInvoice.balance).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sibling & Concession Toggle */}
                  <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Sibling / Staff Concession Rule
                      </span>
                      <span className="text-xs text-amber-700">Apply 20% sibling tuition deduction for second enrolled ward.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyingSiblingDiscount}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setApplyingSiblingDiscount(checked);
                          if (checked) {
                            const disc = Math.round((Number(selectedInvoice.totalAmount) * 0.2));
                            setTenderAmount(String(Math.max(0, selectedInvoice.balance - disc)));
                          } else {
                            setTenderAmount(String(selectedInvoice.balance));
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {/* Payment Collection Form */}
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Tender Amount */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Payment Amount Tender (₹)
                        </label>
                        <input
                          type="number"
                          value={tenderAmount}
                          onChange={(e) => setTenderAmount(e.target.value)}
                          max={selectedInvoice.balance}
                          min="1"
                          required
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="CASH">CASH (Physical Drawer)</option>
                          <option value="UPI">UPI / QR Code Scan</option>
                          <option value="CARD">Debit / Credit Card (POS EDC)</option>
                          <option value="CHEQUE">Cheque / Demand Draft</option>
                          <option value="BANK_TRANSFER">Direct NEFT / RTGS</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Tender Amount Chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs text-slate-400 font-semibold py-1">Quick Select:</span>
                      <button
                        type="button"
                        onClick={() => setTenderAmount(String(selectedInvoice.balance))}
                        className="text-xs font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
                      >
                        Full Balance (₹{selectedInvoice.balance?.toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTenderAmount('5000')}
                        className="text-xs font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
                      >
                        ₹5,000
                      </button>
                      <button
                        type="button"
                        onClick={() => setTenderAmount('10000')}
                        className="text-xs font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
                      >
                        ₹10,000
                      </button>
                    </div>

                    {/* Cashier Notes */}
                    <div>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Cashier receipt notes or bank cheque ref (optional)..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Submit Action */}
                    <button
                      type="submit"
                      disabled={processing || selectedInvoice.balance <= 0}
                      className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Receipt className="w-4 h-4" />
                      )}
                      <span>Confirm Collection & Print POS Receipt (₹{Number(tenderAmount || 0).toLocaleString()})</span>
                    </button>
                  </form>

                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 text-slate-400">
                  Select a student invoice from the left panel to begin counter settlement.
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Day-End Cash Book & Ledger View */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Day-End Shift Collections & Reversals</h3>
                <p className="text-xs text-slate-500">Audit trail of all counter collections with supervisor reversal controls.</p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                Active Session
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Receipt #</th>
                    <th className="py-3 px-6">Student</th>
                    <th className="py-3 px-6">Invoice</th>
                    <th className="py-3 px-6">Method</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">No shift receipts recorded yet today.</td>
                    </tr>
                  ) : (
                    recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-6 font-mono font-bold text-slate-900">{p.transactionReference}</td>
                        <td className="py-3 px-6">
                          <span className="font-bold text-slate-900">{p.firstName} {p.lastName}</span>
                          <span className="block text-xs font-mono text-slate-400">{p.admissionNumber}</span>
                        </td>
                        <td className="py-3 px-6 font-mono text-xs">{p.invoiceNumber}</td>
                        <td className="py-3 px-6">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-6 font-extrabold text-slate-900">₹{Number(p.amount).toLocaleString()}</td>
                        <td className="py-3 px-6">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.paymentStatus === 'SUCCESSFUL' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          {p.paymentStatus === 'SUCCESSFUL' && (
                            <button
                              onClick={() => {
                                setReversalTarget(p);
                                setReversalReason('');
                              }}
                              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 ml-auto"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reverse Voucher
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* POS Thermal & A4 Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Payment Confirmed
              </span>
              <button
                onClick={() => setCompletedReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable 80mm Thermal Receipt Layout */}
            <div id="printable-receipt" className="border border-dashed border-slate-300 p-6 rounded-2xl bg-slate-50 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center space-y-0.5">
                <h2 className="font-extrabold text-sm uppercase text-slate-900">{completedReceipt.institution?.name}</h2>
                <p className="text-[10px] text-slate-500">{completedReceipt.institution?.address}</p>
                <p className="text-[10px] text-slate-500">Ph: {completedReceipt.institution?.phone}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-1.5 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span className="font-bold">{completedReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(completedReceipt.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{completedReceipt.cashierName}</span>
                </div>
              </div>

              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>STUDENT:</span>
                  <span className="font-bold">{completedReceipt.student?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>ADM NO:</span>
                  <span>{completedReceipt.student?.admissionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLASS:</span>
                  <span>{completedReceipt.student?.classSection}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>METHOD:</span>
                  <span>{completedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900">
                  <span>AMOUNT PAID:</span>
                  <span>₹{completedReceipt.amountPaid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>REM. BALANCE:</span>
                  <span>₹{completedReceipt.remainingBalance?.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-1">
                Computer-generated POS fee receipt. Keep for records.
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={triggerBrowserPrint}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip (80mm)</span>
              </button>
              <button
                onClick={() => setCompletedReceipt(null)}
                className="py-3 px-4 border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Supervisor Reversal Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase text-rose-600 tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                Authorize Payment Cancellation
              </span>
              <button onClick={() => setReversalTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              You are reversing receipt <span className="font-mono font-bold text-slate-900">{reversalTarget.transactionReference}</span> for ₹{Number(reversalTarget.amount).toLocaleString()}. This action generates an immutable audit voucher and restores the student's invoice balance.
            </p>

            <form onSubmit={handleReversalSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Mandatory Cancellation Reason
                </label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Duplicate entry by counter clerk or incorrect mode selected..."
                  required
                  rows="3"
                  className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalTarget(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reversing}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  {reversing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>Issue Reversal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
