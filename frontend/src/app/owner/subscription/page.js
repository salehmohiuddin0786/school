'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  School,
  Check,
  ShieldCheck,
  ArrowRight,
  Loader2
} from 'lucide-react';

export default function TenantSubscriptionPage() {
  const [tenantSub, setTenantSub] = useState({
    planName: 'Growth Campus',
    tier: 'GROWTH',
    price: 6999,
    cycle: 'MONTHLY',
    expiryDate: '2027-10-24',
    status: 'ACTIVE',
    maxStudents: 2000,
    maxStaff: 100,
    maxCampuses: 5,
    enrolledStudents: 0,
    enrolledStaff: 1,
    activeCampuses: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscriptionData() {
      try {
        setLoading(true);
        const [subRes, overviewRes, campusesRes] = await Promise.all([
          fetch('/api/v1/owner/subscriptions').then(r => r.json()).catch(() => null),
          fetch('/api/v1/owner/overview').then(r => r.json()).catch(() => null),
          fetch('/api/v1/owner/campuses').then(r => r.json()).catch(() => null),
        ]);

        if (subRes?.subscriptions && subRes.subscriptions.length > 0) {
          const sub = subRes.subscriptions[0];
          setTenantSub(prev => ({
            ...prev,
            planName: sub.planName || prev.planName,
            tier: sub.planCode?.includes('SCALE') ? 'ENTERPRISE' : sub.planCode?.includes('GROWTH') ? 'GROWTH' : 'STARTER',
            price: Number(sub.planPrice) || prev.price,
            cycle: sub.billingCycle || 'MONTHLY',
            status: sub.status || 'ACTIVE',
            expiryDate: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : prev.expiryDate,
            enrolledStudents: Number(overviewRes?.totalStudents || 0),
            enrolledStaff: Number(overviewRes?.staffCount || 1),
            activeCampuses: Array.isArray(campusesRes) ? campusesRes.length : 1,
          }));
        } else if (overviewRes) {
          setTenantSub(prev => ({
            ...prev,
            enrolledStudents: Number(overviewRes.totalStudents || 0),
            enrolledStaff: Number(overviewRes.staffCount || 1),
            activeCampuses: Array.isArray(campusesRes) ? campusesRes.length : 1,
          }));
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSubscriptionData();
  }, []);

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/30">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3 uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" /> Institution SaaS License
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Subscription &amp; Entitlements
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            View your institution's active SaaS tier, allocated student capacity quotas, renewal dates, and available feature modules.
          </p>
        </div>

        {/* Current Active Plan Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/40 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                  {tenantSub.tier} TIER
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> {tenantSub.status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{tenantSub.planName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Valid until: <strong>{tenantSub.expiryDate}</strong></p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-3xl font-black text-slate-900">₹{tenantSub.price.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">per {tenantSub.cycle.toLowerCase()}</div>
            </div>
          </div>

          {/* Quotas & Capacity Utilization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Student Capacity</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {tenantSub.enrolledStudents} <span className="text-xs text-slate-400 font-normal">/ {tenantSub.maxStudents} max</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (tenantSub.enrolledStudents / tenantSub.maxStudents) * 100)}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty &amp; Staff</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {tenantSub.enrolledStaff} <span className="text-xs text-slate-400 font-normal">/ {tenantSub.maxStaff} max</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, (tenantSub.enrolledStaff / tenantSub.maxStaff) * 100)}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Branches</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {tenantSub.activeCampuses} <span className="text-xs text-slate-400 font-normal">/ {tenantSub.maxCampuses} max</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, (tenantSub.activeCampuses / tenantSub.maxCampuses) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Included Features */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Included SaaS Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Multi-Campus Central Command</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> CBSE / ICSE Report Card Generation</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Biometric Staff Attendance</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Automated Teacher Substitution Engine</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Fee Desk Counter &amp; Online Invoicing</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Bus Transport Fleet Live GPS Tracking</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
