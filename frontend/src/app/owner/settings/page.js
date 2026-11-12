'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe,
  DollarSign,
  Save,
  Server
} from 'lucide-react';

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: 'Digital Crowd Multi-Tenant ERP',
    supportEmail: 'support@schoolnext.internal',
    defaultTrialDays: '14',
    taxRate: '18',
    maintenanceMode: false,
    allowSelfRegistration: false,
    enforceMfaForAdmins: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Platform Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            SaaS Platform Settings
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Configure global defaults, billing parameters, tenant partition rules, and platform-wide security policies.
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Platform settings saved and propagated across active nodes.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900 border-b pb-2">General Platform Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={e => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Platform Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Tenant Trial Period (Days)</label>
                <input
                  type="number"
                  value={settings.defaultTrialDays}
                  onChange={e => setSettings({ ...settings, defaultTrialDays: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GST / VAT Rate Percentage (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={e => setSettings({ ...settings, taxRate: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-slate-900 border-b pb-2 pt-4">Security & Multi-Tenant Partitioning</h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.enforceMfaForAdmins}
                  onChange={e => setSettings({ ...settings, enforceMfaForAdmins: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Enforce Multi-Factor Authentication (MFA)</span>
                  <span className="text-[11px] text-slate-500">Require TOTP authentication for all Super Admins and Platform Operators.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Platform Maintenance Mode</span>
                  <span className="text-[11px] text-slate-500">Temporarily restrict tenant user logins during platform database upgrades.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
