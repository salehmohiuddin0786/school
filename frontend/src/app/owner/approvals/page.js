'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Building2,
  AlertCircle,
  FileText,
  Lock,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';

export default function OwnerApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [authPin, setAuthPin] = useState('1234');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/owner/approvals/pending');
      const data = await res.json();
      if (Array.isArray(data)) {
        setApprovals(data);
      }
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const openDecisionModal = (req, type) => {
    setSelectedReq(req);
    setDecisionType(type);
    setAuthPin('1234');
    setNotes(type === 'APPROVED' ? 'Approved for FY26 capital budget execution.' : 'Declined per Q3 capex freeze.');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/v1/owner/approvals/${selectedReq.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decisionType,
          notes: notes.trim(),
          authPin: authPin.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        setSuccessMsg(json.message || `Requisition ${selectedReq.id} has been ${decisionType}.`);
        setTimeout(() => {
          setSelectedReq(null);
          fetchApprovals();
        }, 1200);
      } else {
        setErrorMsg(json.error || 'Failed to authorize requisition.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error occurred during authorization.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPendingAmount = approvals.reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
  const highestReq = approvals.length > 0 ? Math.max(...approvals.map(a => Number(a.amount) || 0)) : 0;

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Executive Sign-Off Desk</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Capital Expenditure (Capex) Approvals
              </h1>
              <p className="text-sm text-indigo-200/80 mt-1 max-w-xl">
                High-value institutional purchase orders, laboratory equipment requisitions, and infrastructure expansions awaiting digital Owner authorization.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchApprovals}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Queue</span>
              </button>
              <Link
                href="/owner"
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <span>Institutional Suite</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pending Outflow</span>
            <div className="mt-2">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{totalPendingAmount.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                Across {approvals.length} pending procurement requests
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Largest Pending Item</span>
            <div className="mt-2">
              <div className="text-3xl font-black text-indigo-600 tracking-tight">
                ₹{highestReq.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                Subject to dual-signature policy
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Authorized Signatory</span>
            <div className="mt-2">
              <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Executive Owner PIN</span>
              </div>
              <div className="text-xs font-semibold text-emerald-600 mt-1">
                Digital signature vault active (PIN: 1234)
              </div>
            </div>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Requisitions Pending Executive Sign-off</h3>
              <p className="text-xs text-slate-500">Carefully verify department justifications, quote vendors, and amounts before authorization.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black">
              {approvals.length} Action Items
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading procurement queue...</div>
          ) : approvals.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900">Zero Pending Requisitions</h4>
              <p className="text-xs text-slate-400 mt-1">All high-value capital expenditures have been reviewed and decided.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {approvals.map((req) => (
                <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        {req.id}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        req.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.priority} Priority
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {req.category}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900">{req.title}</h4>
                    <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{req.justification}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <div>Dept: <span className="font-bold text-slate-700">{req.department}</span></div>
                      <div>Requested By: <span className="font-bold text-slate-700">{req.requestedBy}</span></div>
                      <div>Vendor: <span className="font-bold text-slate-700">{req.vendor}</span></div>
                      <div>Submitted: <span className="font-semibold text-slate-500">{new Date(req.submittedAt).toLocaleDateString()}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-end justify-between gap-4 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Requisition Value</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tight">₹{Number(req.amount).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDecisionModal(req, 'REJECTED')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold border border-slate-200 hover:border-rose-200 transition-all"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => openDecisionModal(req, 'APPROVED')}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                      >
                        Sign &amp; Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DECISION PIN MODAL */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Digital Authorization Protocol</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {decisionType === 'APPROVED' ? 'Authorize Requisition' : 'Decline Requisition'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedReq.id} &bull; {selectedReq.title}</p>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Requisition Amount</span>
                  <span className="font-extrabold text-slate-900 text-lg">₹{Number(selectedReq.amount).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-medium">Beneficiary Vendor</span>
                  <span className="font-bold text-slate-700">{selectedReq.vendor}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleDecisionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Owner Authorization PIN <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      value={authPin}
                      onChange={(e) => setAuthPin(e.target.value)}
                      placeholder="Enter 4-digit PIN (default 1234)"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono tracking-widest text-center text-lg font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Secured cryptographic sign-off for audit tracking. Default owner PIN is <span className="font-mono font-bold">1234</span>.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Decision Remarks &amp; Budget Line
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter audit remarks or budget allocation code..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition-all ${
                      decisionType === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    }`}
                  >
                    {submitting ? 'Authenticating...' : decisionType === 'APPROVED' ? 'Confirm & Sign Approval' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
