'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BarChart3,
  TrendingUp,
  School,
  Building2,
  Users,
  DollarSign,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function InstitutionReportsPage() {
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/owner/campuses/comparison');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCampuses(data);
        }
      } catch (err) {
        console.error('Failed to load campus comparison:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" /> Institutional Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Institution Reports &amp; Benchmarks
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Branch-by-branch financial performance, student growth metrics, fee realization ratios, and operational benchmarks across your campuses.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Institutional PDF</span>
          </button>
        </div>

        {/* Campus Benchmark Cards */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <School className="w-4 h-4 text-amber-600" />
              <span>Campus Benchmark Comparison</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Session 2026–2027</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span>Loading campus benchmark comparisons...</span>
            </div>
          ) : campuses.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <School className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No campuses registered yet</p>
              <p className="text-slate-400 mt-1">Add branch campuses from Campus Management to view comparative benchmarks.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Branch Campus</th>
                    <th className="py-3.5 px-4">Enrolled Students</th>
                    <th className="py-3.5 px-4">Staff Strength</th>
                    <th className="py-3.5 px-4">Fee Collection Rate</th>
                    <th className="py-3.5 px-4">Revenue YTD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {campuses.map(cp => (
                    <tr key={cp.campusId || cp.campusName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{cp.campusName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {cp.campusCode} {cp.isMain ? '• Flagship Campus' : ''}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {Number(cp.totalStudents || 0).toLocaleString()}
                        <span className="text-[10px] text-slate-400 ml-1">/ {cp.capacity || 500}</span>
                      </td>
                      <td className="py-4 px-4 text-emerald-600 font-bold">
                        {Number(cp.staffCount || 0)} personnel
                      </td>
                      <td className="py-4 px-4 text-indigo-600 font-bold">
                        {cp.collectionEfficiency ?? 0}%
                      </td>
                      <td className="py-4 px-4 font-black text-slate-900">
                        ₹{Number(cp.collectionsYtd || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
