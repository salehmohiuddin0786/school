'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Edit,
  DollarSign,
  TrendingUp,
  X,
  PlusCircle,
  Calendar,
  Layers,
  Users,
  Check
} from 'lucide-react';

export default function SubscriptionsManagementPage() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit / Upgrade Modal State
  const [subModalData, setSubModalData] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/v1/owner/subscriptions');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
        setSubscriptions(data.subscriptions || []);
      } else {
        showToast(data.error || 'Failed to load subscriptions', 'error');
      }
    } catch {
      showToast('Error connecting to subscriptions service', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    if (!subModalData) return;
    try {
      const res = await fetch(`/api/v1/owner/institutions/${subModalData.tenantId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: subModalData.planId,
          extendMonths: parseInt(subModalData.extendMonths || 1, 10),
          status: subModalData.status || 'ACTIVE'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Tenant subscription updated successfully');
        setSubModalData(null);
        loadData();
      } else {
        showToast(data.error || 'Failed to update subscription', 'error');
      }
    } catch {
      showToast('Error updating subscription', 'error');
    }
  };

  const totalMrr = subscriptions.reduce((sum, s) => sum + (s.status === 'ACTIVE' ? Number(s.planPrice || 0) : 0), 0);
  const activeSubsCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const trialSubsCount = subscriptions.filter(s => s.status === 'TRIAL').length;

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Toast Alert */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border text-sm font-semibold transition-all ${
            toast.type === 'error' ? 'bg-rose-900/90 text-white border-rose-700' : 'bg-slate-900/90 text-white border-slate-700'
          }`}>
            {toast.type === 'error' ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" /> SaaS Monetization & Entitlements
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Subscription Management
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Oversee recurring billing plans, student capacity quotas, license periods, and individual tenant subscription states across the platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-bold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/owner/institutions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>View Institutions</span>
            </Link>
          </div>
        </div>

        {/* SaaS Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Platform MRR</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">₹{totalMrr.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Monthly Recurring Run-rate</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Projected ARR</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">₹{(totalMrr * 12).toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1">Annualized billing potential</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Active Subscriptions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{activeSubsCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Paid licenses in good standing</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Evaluation / Trials</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2">{trialSubsCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Active evaluation windows</div>
          </div>
        </div>

        {/* Section 1: Subscription Tiers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Available Subscription Tiers</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">{plans.length} Standard Plans Configured</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isGrowth = p.tier === 'GROWTH';
              return (
                <div
                  key={p.id}
                  className={`rounded-3xl p-6 sm:p-7 border-2 flex flex-col justify-between transition-all ${
                    isGrowth
                      ? 'bg-gradient-to-b from-indigo-900 to-slate-900 text-white border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        isGrowth ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/30' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.tier} TIER
                      </span>
                      {isGrowth && <span className="text-[10px] font-bold text-indigo-300">Popular Choice</span>}
                    </div>

                    <h3 className="text-xl font-black mt-3">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-black">₹{Number(p.price).toLocaleString()}</span>
                      <span className={`text-xs ${isGrowth ? 'text-indigo-200' : 'text-slate-500'}`}>
                        /{p.billingCycle.toLowerCase()}
                      </span>
                    </div>

                    <p className={`text-xs mt-3 leading-relaxed ${isGrowth ? 'text-slate-300' : 'text-slate-600'}`}>
                      Ideal for {p.tier === 'STARTER' ? 'single-campus private schools' : p.tier === 'GROWTH' ? 'rapidly expanding schools & colleges' : 'large educational trusts with multi-campus branches'}.
                    </p>

                    <div className="mt-6 pt-5 border-t border-slate-200/40 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 shrink-0 ${isGrowth ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span>Up to <strong>{p.maxStudents}</strong> Enrolled Students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 shrink-0 ${isGrowth ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span>Up to <strong>{p.maxStaff}</strong> Faculty & Staff</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 shrink-0 ${isGrowth ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span>Up to <strong>{p.maxCampuses}</strong> Campus Branch{(p.maxCampuses > 1 ? 'es' : '')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 shrink-0 ${isGrowth ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span>Student Roll Call & CBSE Report Cards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 shrink-0 ${isGrowth ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span>Fee Counter POS & Bus Tracking</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    <Link
                      href="/owner/institutions/create"
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
                        isGrowth
                          ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Onboard with {p.name}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Active Tenant Subscriptions Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Tenant Subscription Directory</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">{subscriptions.length} Subscriptions Tracked</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Institution</th>
                    <th className="py-3.5 px-4">Plan Tier</th>
                    <th className="py-3.5 px-4">Rate & Cycle</th>
                    <th className="py-3.5 px-4">Period Range</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                        <span>Loading subscriptions...</span>
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No tenant subscriptions found.</p>
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
                      const isExpired = periodEnd && periodEnd < new Date();
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-900">{sub.tenantName}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {sub.tenantId}</div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              {sub.planName || 'Custom'}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900">₹{Number(sub.planPrice || 0).toLocaleString()}</div>
                            <div className="text-[11px] text-slate-400">/{sub.planCycle ? sub.planCycle.toLowerCase() : 'monthly'}</div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="text-slate-800">
                              End: <strong className={isExpired ? 'text-rose-600' : 'text-slate-900'}>
                                {periodEnd ? periodEnd.toLocaleDateString() : 'N/A'}
                              </strong>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Start: {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              sub.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sub.status === 'TRIAL'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {sub.status}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => setSubModalData({
                                tenantId: sub.tenantId,
                                tenantName: sub.tenantName,
                                planId: sub.planId,
                                extendMonths: 1,
                                status: sub.status
                              })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Modify Plan</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODIFY MODAL */}
        {subModalData && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleSubSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Modify Subscription</h3>
                  <p className="text-xs text-slate-500 font-semibold">{subModalData.tenantName}</p>
                </div>
                <button type="button" onClick={() => setSubModalData(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Select Plan</label>
                  <select
                    value={subModalData.planId}
                    onChange={e => setSubModalData({ ...subModalData, planId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{Number(p.price).toLocaleString()} / {p.billingCycle.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Extend License Validity</label>
                  <select
                    value={subModalData.extendMonths}
                    onChange={e => setSubModalData({ ...subModalData, extendMonths: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="1">1 Month Extension</option>
                    <option value="3">3 Months (Quarterly)</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year Renewal)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Subscription Status</label>
                  <select
                    value={subModalData.status}
                    onChange={e => setSubModalData({ ...subModalData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
