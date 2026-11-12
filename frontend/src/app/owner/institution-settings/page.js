'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Sparkles,
  Save,
  CheckCircle2,
  Calendar,
  Clock,
  School,
  Bell
} from 'lucide-react';

export default function InstitutionSettingsPage() {
  const [settings, setSettings] = useState({
    academicYear: '2026-2027',
    workingDaysPerWeek: '6',
    periodsPerDay: '8',
    periodDurationMins: '45',
    feeOverdueGraceDays: '10',
    attendanceAlertSms: true,
    autoSubstitutionEnabled: true,
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
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/30">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Institution Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Institution Settings
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Configure institutional academic calendars, fee collection rules, bell schedules, and automated notification triggers.
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Institution settings saved and updated across all branches.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900 border-b pb-2">Academic &amp; Timetable Parameters</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Active Academic Year</label>
                <input
                  type="text"
                  value={settings.academicYear}
                  onChange={e => setSettings({ ...settings, academicYear: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Working Days per Week</label>
                <select
                  value={settings.workingDaysPerWeek}
                  onChange={e => setSettings({ ...settings, workingDaysPerWeek: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium"
                >
                  <option value="5">5 Days (Monday – Friday)</option>
                  <option value="6">6 Days (Monday – Saturday)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teaching Periods per Day</label>
                <input
                  type="number"
                  value={settings.periodsPerDay}
                  onChange={e => setSettings({ ...settings, periodsPerDay: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Period Duration (Minutes)</label>
                <input
                  type="number"
                  value={settings.periodDurationMins}
                  onChange={e => setSettings({ ...settings, periodDurationMins: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-medium"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-slate-900 border-b pb-2 pt-4">Fee Collection &amp; Automation</h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fee Overdue Grace Period (Days)</label>
              <input
                type="number"
                value={settings.feeOverdueGraceDays}
                onChange={e => setSettings({ ...settings, feeOverdueGraceDays: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-xl font-medium"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.attendanceAlertSms}
                  onChange={e => setSettings({ ...settings, attendanceAlertSms: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Automated Absentee Parent SMS Alerts</span>
                  <span className="text-[11px] text-slate-500">Dispatch SMS to parents whenever a student is marked absent during morning roll call.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.autoSubstitutionEnabled}
                  onChange={e => setSettings({ ...settings, autoSubstitutionEnabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Smart Automated Relief Substitution</span>
                  <span className="text-[11px] text-slate-500">Automatically suggest and assign available substitute teachers during morning attendance punch.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Policy Settings</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
